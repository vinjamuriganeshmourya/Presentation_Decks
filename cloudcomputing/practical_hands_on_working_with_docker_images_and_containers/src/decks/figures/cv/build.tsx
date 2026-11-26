import type { CSSProperties, ReactNode } from 'react'
import { Box, CheckCircle2, FileCode2, FolderOpen, Globe, Hammer, ListChecks, Network, Play, Terminal, Trash2 } from 'lucide-react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Fade, STILL, useBuild, useCycle } from '../scene'
import { Crop, MARK, Mono, SHOT_GROUP_H, SHOT_MAX_W, SHOT_MID, SHOT_MIN_G, SHOT_SIZE, STACK, StepLabel, textLines, type Rect } from './frames'
import { Bullet, fx } from './fx'
import { LAB } from '../clay-b'
import boy from './icons/build-boy-laptop.png'

/**
 * PART B, "Custom Image Trace" (spec cards T11-1 .. T11-8, slides 33 to 40 after the 2026-11-03 merge).
 * Every string is the spec's. Commands, file names and image names in `Mono`.
 *
 * Corrections pass 2026-11-03:
 *   33  T11-1   text beside the visual, top (the lead) and bottom (the tree and its line note), all left-aligned,
 *               a human illustration on the right; the tree builds one line per step
 *   34-36       G9: step label, a 2px rule, TWO shots side by side (the full TR capture, then a zoom of the
 *               ringed part of the SAME capture), the caption in a box below; one step each. Slide 35's ring
 *               ran to the capture's right edge and read as cropped: the wide captures are now padded with
 *               the editor's own background so the ring closes inside the frame
 *   37  T11-4   the strip smaller, the two steps as large cards; the `docker build` pill centred over its
 *               arrow (it was wider than its slot); interactive-style button pills; one step per stage
 *   38  T11-5   + T11-6 merged (`PartB5`): both terminal strips, each with its step, line and caption box
 *   39  T11-7   37's layout: a wordless strip on top (browser stop lit), the step and its two shots below
 *   40  T11-8   37's layout, the clean-up told in steps
 *
 * Round 2 (2026-11-03): no zoom icon / connector between a capture and its zoom; numbered `ZoomBadge`s pair
 * each ring with its zoom (`BadgedCrop`). 35-37: badge 1. 40: badges 1 (address bar) and 2 (page heading).
 * 39's terminal strips have rings but no zooms, so no badges.
 * 2026-11-04 (user): T11-1b, T11-2, T11-3 (slides 34-36) lost their ring and badge; T11-5 split again into
 * T11-5 (Step 6) and T11-6 (Step 7), so every slide after 38 moved up one (74 slides).
 */

const K = 'Build Run Verify'
const T = 'Custom Image Trace'
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
/** the editor and terminal background in every TR capture (30, 30, 30), so a padded frame reads as the window */
const DARK = '#1E1E1E'

/** One spec line at the points size. */
function Line({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <p className="m-0 leading-snug" style={{ fontSize: size, color: colors.ink }}>
      {children}
    </p>
  )
}

/** A lucide icon with a looping micro-animation (fx class on a wrapping span). */
function Fx({ kind, delay = 0, dur, children, style }: { kind: string; delay?: number; dur?: number; children: ReactNode; style?: CSSProperties }) {
  const f = fx(kind, delay, dur)
  return (
    <span className={`inline-grid place-items-center ${f.className}`} style={{ ...f.style, ...style }}>
      {children}
    </span>
  )
}

/** The explanation box under a picture: an icon bullet, then the caption. */
function CaptionBox({ icon, children, trail }: { icon: ReactNode; children: ReactNode; trail?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] px-5 py-3" style={{ background: colors.white, boxShadow: '0 12px 26px -20px rgba(16,32,58,0.6), inset 0 0 0 1px rgba(16,32,58,0.08)' }}>
      <Bullet kind="icon" size={17} tone={colors.brand}>
        {icon}
      </Bullet>
      <p className="m-0 min-w-0 flex-1 text-[17px] font-semibold leading-[1.45]" style={{ color: colors.ink }}>
        {children}
      </p>
      {trail}
    </div>
  )
}


/* ------------------------------------------------------------------ T11-1 */

const TREE = ['cloud-docker-demo/', '├── index.html', '└── Dockerfile']

/** The project folder as an editor panel, one line per step, each with the icon of what it is. */
function FolderTree({ n }: { n: number }) {
  const icons = [
    <FolderOpen key="f" size={22} color="#F5B942" />,
    <FileCode2 key="h" size={22} color="#F0883E" />,
    <img key="d" src={MARK.docker} alt="" draggable={false} className="block w-auto select-none" style={{ height: 20 }} />,
  ]
  return (
    <div className="overflow-hidden rounded-[16px]" style={{ width: 430, background: '#0E1A33', boxShadow: '0 22px 40px -26px rgba(16,32,58,0.8)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} className="block rounded-full" style={{ width: 11, height: 11, background: c }} />
        ))}
        <span className="ml-2 font-mono text-[15px]" style={{ color: '#C9D3E3' }}>
          Project folder
        </span>
      </div>
      <div className="flex flex-col gap-2 px-4 py-4">
        {TREE.map((t, i) => (
          <div
            key={t}
            className="flex items-center gap-4 font-mono text-[22px] leading-none"
            style={{ opacity: n > i ? 1 : 0.12, transform: n > i ? 'none' : 'translateX(-8px)', transition: `all 520ms ${EASE}`, fontVariantLigatures: 'none' }}
          >
            <span className="w-4 text-right text-[16px]" style={{ color: '#5D6B85' }}>
              {i + 1}
            </span>
            <span className="whitespace-pre" style={{ color: '#E8EEF8' }}>
              {t}
            </span>
            <span className="ml-auto grid place-items-center" style={{ width: 28, height: 28, opacity: n > i ? 1 : 0, transform: n > i ? 'scale(1)' : 'scale(0.4)', transition: `all 460ms cubic-bezier(0.34,1.56,0.64,1) 200ms` }}>
              {n > i ? <Fx kind="hop" delay={i * 0.4} dur={2.4}>{icons[i]}</Fx> : icons[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PartB1({ lesson }: { lesson: string }) {
  /* steps: tree line 1, 2, 3, then the line note */
  const b = useBuild(4, 800)
  return (
    <Card id="T11-1" kicker={K} title={T} lesson={lesson}>
      <div className="grid items-center" style={{ width: BOX_W, gridTemplateColumns: '1fr 300px', gap: 36 }}>
        <div className="flex flex-col items-start" style={{ gap: 30 }}>
          <p className="m-0 border-l-4 pl-4 text-[21px] leading-[1.45]" style={{ color: colors.ink, borderColor: colors.brand }}>
            Part B builds a custom image from a Dockerfile, confirming the same image-container relationship already seen with pulled images
          </p>
          <div className="flex items-center" style={{ gap: 28 }}>
            <FolderTree n={b} />
            <Fade on={b >= 4} style={{ width: 300 }}>
              <div className="flex items-start gap-2.5">
                <Bullet kind="arrow" size={19} />
                <Line size={19}>Lines 1-3: A project folder holding the page content and the build instructions</Line>
              </div>
            </Fade>
          </div>
        </div>
        <div className="relative grid place-items-center" style={{ height: 380 }}>
          <span aria-hidden className="absolute rounded-full" style={{ width: 280, height: 280, background: `radial-gradient(circle, ${colors.brand}22 0%, ${colors.brand}00 70%)` }} />
          <Fx kind="lift" dur={3.2}>
            <img src={boy} alt="" draggable={false} className="relative block select-none" style={{ width: 250 }} />
          </Fx>
          {/* the three things in the folder float up from the laptop as their lines appear */}
          {[
            { at: { left: 14, top: 40 }, icon: <FolderOpen size={22} color="#F5B942" /> },
            { at: { right: 6, top: 18 }, icon: <FileCode2 size={22} color="#F0883E" /> },
            { at: { right: 0, top: 150 }, icon: <img src={MARK.docker} alt="" draggable={false} className="block w-auto select-none" style={{ height: 20 }} /> },
          ].map((f, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute grid place-items-center rounded-full"
              style={{ ...f.at, width: 46, height: 46, background: colors.white, boxShadow: `inset 0 0 0 2px ${colors.brand}55, 0 10px 18px -12px rgba(16,32,58,0.6)`, opacity: b > i ? 1 : 0, transform: b > i ? 'scale(1)' : 'scale(0.4)', transition: `all 480ms cubic-bezier(0.34,1.56,0.64,1)` }}
            >
              <Fx kind="bob" delay={i * 0.5} dur={2.2}>{f.icon}</Fx>
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-1b .. T11-3: the screenshot pair */

/**
 * THE SCREENSHOT SLIDE, Part B (user, 2026-11-04): the step label and its line, a 2px rule, the TR capture
 * whole (no zoom copy) with its orange ring and no number, the caption in a box below; the group centred
 * on the slide (`SHOT_MID`) and the capture as large as the body's height allows, never above its source
 * size (`frames.tsx`). Steps: the capture with its ring, the box.
 */
function BuildPair({
  id, lesson, step, lines = [], caption, chars, name, crop, region, bg, icon,
}: {
  id: string; lesson: string; step: ReactNode; lines?: ReactNode[]; caption: ReactNode; chars: number; name: string; crop?: Rect
  region: Rect; bg?: string; icon: ReactNode
}) {
  const b = useBuild(2, 900)
  const alt = typeof caption === 'string' ? caption : ''
  const [x0, y0, cw, ch] = crop ?? [0, 0, ...SHOT_SIZE[name]]
  /* the head: the 22px label, 10px gap, each 18px line, the rule with its 16px padding; the caption box (17px, py-3) */
  const head = 28 + lines.length * 35 + 18
  const fit = (n: number) => Math.min(SHOT_MAX_W / cw, (SHOT_GROUP_H - head - 2 * 14 - (24 + n * 25)) / ch, 1)
  const groupW = (s: number) => Math.max(Math.round(cw * s), SHOT_MIN_G)
  const n = Math.max(textLines(chars, groupW(fit(2))), textLines(chars, groupW(fit(1))))
  const s = fit(n)
  const G = groupW(s)
  return (
    <Card id={id} kicker={K} title={T} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <div className="flex flex-col" style={{ width: G, marginLeft: SHOT_MID - G / 2, gap: 14 }}>
          <div className="flex flex-col gap-2.5">
            <StepLabel>{step}</StepLabel>
            {lines.map((l, i) => (
              <Line key={i}>{l}</Line>
            ))}
          </div>
          <div className="flex items-center justify-center" style={{ borderTop: `2px solid ${colors.line}`, paddingTop: 16 }}>
            <Fade on={b >= 1}>
              <Crop name={name} crop={[x0, y0, cw, ch]} highlight={region} maxW={cw * s} maxH={ch * s} bg={bg} alt={alt} />
            </Fade>
          </div>
          <Fade on={b >= 2}>
            <CaptionBox icon={icon}>{caption}</CaptionBox>
          </Fade>
        </div>
      </div>
    </Card>
  )
}

/** T11-1, second half: Step 1 as the other step slides show a step. */
export function PartB1b({ lesson }: { lesson: string }) {
  return (
    <BuildPair
      id="T11-1b"
      lesson={lesson}
      step="Step 1: Project Folder Created"
      lines={[
        <>
          create folder <Mono>cloud-docker-demo/</Mono> with <Mono>index.html</Mono> and <Mono>Dockerfile</Mono>
        </>,
      ]}
      caption={
        <>
          VS Code: <Mono>cloud-docker-demo</Mono> folder created in the file explorer
        </>
      }
      name="slide-11-1"
      region={[6, 48, 194, 36]}
      chars={'VS Code: cloud-docker-demo folder created in the file explorer'.length}
      icon={<FolderOpen />}
    />
  )
}

/** User, 2026-10-30: the top band keeps only the step label and its line. The ring now closes inside the frame (slide 35 fix). */
export function PartB2({ lesson }: { lesson: string }) {
  return (
    <BuildPair
      id="T11-2"
      lesson={lesson}
      step={
        <>
          Step 2: <Mono>index.html</Mono> Written
        </>
      }
      lines={[
        <>
          write <Mono>index.html</Mono> with a heading and a short message
        </>,
      ]}
      caption={
        <>
          VS Code: <Mono>index.html</Mono> content: the custom page this container will serve
        </>
      }
      name="slide-11-2"
      crop={[0, 0, 1640, 520]}
      bg={DARK}
      region={[698, 226, 912, 72]}
      chars={'VS Code: index.html content: the custom page this container will serve'.length}
      icon={<FileCode2 />}
    />
  )
}

export function PartB3({ lesson }: { lesson: string }) {
  return (
    <BuildPair
      id="T11-3"
      lesson={lesson}
      step={
        <>
          Step 3: <Mono>Dockerfile</Mono> Written
        </>
      }
      caption={
        <>
          VS Code: <Mono>Dockerfile</Mono> content: <Mono>FROM</Mono>, <Mono>COPY</Mono> and <Mono>EXPOSE</Mono> directives
        </>
      }
      name="slide-11-3"
      crop={[0, 0, 1640, 311]}
      bg={DARK}
      region={[786, 120, 826, 126]}
      chars={'VS Code: Dockerfile content: FROM, COPY and EXPOSE directives'.length}
      icon={<img src={MARK.docker} alt="" draggable={false} className="block w-auto select-none" style={{ height: 16 }} />}
    />
  )
}

/* ------------------------------------------------------------------ the flow strip (T11-4, T11-7, T11-8) */

type StopKey = 'file' | 'build' | 'image' | 'run' | 'container' | 'browser'

function FileGlyph({ tone }: { tone: string }) {
  return (
    <svg width="62" height="74" viewBox="0 0 62 74" aria-hidden>
      <path d="M4 4h38l16 16v50H4z" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      <path d="M42 4v16h16" fill="rgba(255,255,255,0.35)" />
      {[24, 33, 42, 51].map((y) => (
        <rect key={y} x="12" y={y} width={y === 51 ? 24 : 36} height="4" rx="2" fill="rgba(255,255,255,0.85)" />
      ))}
    </svg>
  )
}

function ImageGlyph({ tone }: { tone: string }) {
  return (
    <svg width="86" height="74" viewBox="0 0 86 74" aria-hidden>
      {[46, 32, 18, 4].map((y, i) => (
        <path
          key={y}
          d={`M43 ${y}l39 12-39 12L4 ${y + 12}z`}
          fill={tone}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          style={{ opacity: 0.7 + i * 0.1, transition: `fill 420ms ${EASE}` }}
        />
      ))}
    </svg>
  )
}

function ContainerGlyph({ tone }: { tone: string }) {
  return (
    <svg width="88" height="74" viewBox="0 0 88 74" aria-hidden>
      <path d="M6 22l14-14h62L68 22z" fill={tone} style={{ opacity: 0.75, transition: `fill 420ms ${EASE}` }} />
      <path d="M68 22l14-14v52L68 74z" fill={tone} style={{ opacity: 0.6, transition: `fill 420ms ${EASE}` }} />
      <rect x="6" y="22" width="62" height="52" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      {[30, 42, 54].map((x) => (
        <rect key={x} x={x - 2} y="30" width="4" height="36" rx="2" fill="rgba(255,255,255,0.4)" />
      ))}
    </svg>
  )
}

function BrowserGlyph({ tone }: { tone: string }) {
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" aria-hidden>
      <rect x="3" y="3" width="84" height="64" rx="8" fill="#FFFFFF" stroke={tone} strokeWidth="3" style={{ transition: `stroke 420ms ${EASE}` }} />
      <path d="M3 11a8 8 0 0 1 8-8h68a8 8 0 0 1 8 8v8H3z" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      {[11, 19, 27].map((x) => (
        <circle key={x} cx={x} cy="11" r="2.6" fill="rgba(255,255,255,0.85)" />
      ))}
      <rect x="14" y="30" width="46" height="7" rx="3" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      <rect x="14" y="44" width="62" height="4" rx="2" fill="#C9D3E3" />
      <rect x="14" y="53" width="50" height="4" rx="2" fill="#C9D3E3" />
    </svg>
  )
}

const OFF = '#AEBBD0'

/** A badge on a stop's corner: pops in when `on`, its icon looping while it shows. */
function StopBadge({ on, tone, kind, children }: { on: boolean; tone: string; kind: string; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="absolute grid place-items-center rounded-full"
      style={{ right: -10, top: -10, width: 32, height: 32, background: tone, color: colors.white, boxShadow: '0 8px 16px -8px rgba(16,32,58,0.7)', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.4)', transition: `opacity 360ms ${EASE}, transform 460ms cubic-bezier(0.34,1.56,0.64,1)` }}
    >
      {on && !STILL ? <Fx kind={kind} dur={2.4}>{children}</Fx> : children}
    </span>
  )
}

/** One stop of the strip: a glyph on a raised plate (smaller since 2026-11-03), its name under it when the card names it. */
function Stop({ label, lit, now, dim, glyph, badge }: { label?: ReactNode; lit: boolean; now: boolean; dim: boolean; glyph: (tone: string) => ReactNode; badge?: ReactNode }) {
  const tone = dim ? OFF : lit ? STACK.layer : OFF
  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 128, opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(1)' : 'none', transition: `all 480ms ${EASE}` }}>
      <div
        className="relative grid place-items-center rounded-[16px]"
        style={{
          width: 112,
          height: 88,
          background: lit && !dim ? 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F4F6FA 100%)',
          boxShadow: now ? `0 0 0 3px ${colors.accent}, 0 14px 26px -16px ${colors.accent}` : lit && !dim ? `0 0 0 2px ${colors.brand}55, 0 12px 24px -18px rgba(16,32,58,0.55)` : '0 12px 24px -18px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)',
          transform: now ? 'translateY(-3px)' : 'none',
          transition: `all 480ms ${EASE}`,
        }}
      >
        <div style={{ transform: 'scale(0.78)' }}>{glyph(tone)}</div>
        {badge}
      </div>
      {label !== undefined && (
        <span className="text-center font-heading text-[16px] font-semibold leading-tight" style={{ color: lit && !dim ? colors.ink : colors.muted, transition: `color 420ms ${EASE}` }}>
          {label}
        </span>
      )}
    </div>
  )
}

/**
 * A connector between stops: an interactive-style command pill (icon, then the card's own command when it
 * names one) centred over its arrow. The grey arrow always shows; when `lit` an accent arrow draws over it,
 * line first and the head last, and on the way out the head goes first and the line retracts (G8).
 */
function Link({ label, icon, lit, w = 176 }: { label?: ReactNode; icon?: ReactNode; lit: boolean; w?: number }) {
  const L = w - 24
  return (
    <div className="flex flex-col items-center justify-center gap-2" style={{ width: w, height: 88 }}>
      <span
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 py-1.5 text-[15px] font-semibold leading-none"
        style={{
          visibility: icon || label ? 'visible' : 'hidden',
          color: lit ? colors.brandDark : colors.muted,
          background: lit ? '#FFF1D6' : colors.white,
          boxShadow: lit ? `inset 0 0 0 2px ${colors.accent}, 0 2px 0 ${colors.accent}` : 'inset 0 0 0 1.5px rgba(16,32,58,0.14), 0 3px 0 rgba(16,32,58,0.12)',
          transform: lit ? 'translateY(1px)' : 'none',
          transition: `all 420ms ${EASE}`,
        }}
      >
        {icon && <span className="grid place-items-center" style={{ color: lit ? colors.accent : colors.muted }}>{icon}</span>}
        {label}
      </span>
      <svg width={L + 8} height="16" viewBox={`0 0 ${L + 8} 16`} aria-hidden>
        <line x1="4" y1="8" x2={L - 6} y2="8" stroke="#B8C3D6" strokeWidth="3.5" strokeLinecap="round" />
        <path d={`M${L - 8} 1l12 7-12 7z`} fill="#B8C3D6" />
        <line
          x1="4" y1="8" x2={L - 6} y2="8" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" pathLength={1} strokeDasharray="1"
          style={{ strokeDashoffset: lit ? 0 : 1, transition: lit ? 'stroke-dashoffset 640ms cubic-bezier(0.65,0,0.35,1)' : 'stroke-dashoffset 420ms cubic-bezier(0.65,0,0.35,1) 200ms' }}
        />
        <path d={`M${L - 8} 1l12 7-12 7z`} fill={colors.accent} style={{ opacity: lit ? 1 : 0, transition: lit ? 'opacity 220ms 620ms' : 'opacity 160ms 0ms' }} />
      </svg>
      <span aria-hidden className="text-[15px] leading-none" style={{ visibility: 'hidden' }}>
        .
      </span>
    </div>
  )
}

type Labels = Partial<Record<StopKey, ReactNode>>

/**
 * The TR's slide 6 flow (Dockerfile, Build, Image, Run, Container), redrawn, with browser output at the end.
 * `lit` names the stops in colour, `now` the one the step is on, `dim` the stops greyed out, `badges` a corner
 * badge per stop. Labels are passed in, so each card uses its own words (none on a card that names none).
 */
function FlowStrip({ labels = {}, lit, now, dim = [], badges = {} }: { labels?: Labels; lit: StopKey[]; now?: StopKey; dim?: StopKey[]; badges?: Partial<Record<StopKey, ReactNode>> }) {
  const on = (k: StopKey) => lit.includes(k)
  const off = (k: StopKey) => dim.includes(k)
  const stop = (k: Exclude<StopKey, 'build' | 'run'>, glyph: (t: string) => ReactNode) => (
    <Stop label={labels[k]} lit={on(k)} now={now === k} dim={off(k)} glyph={glyph} badge={badges[k]} />
  )
  return (
    /* one raised track for the whole strip: it enters as one block, then the figure's own steps light it */
    <div className="flex items-start justify-center rounded-[22px] py-3.5" style={{ width: BOX_W, background: 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 0 0 1px rgba(16,32,58,0.07), 0 14px 30px -26px rgba(16,32,58,0.5)' }}>
      {stop('file', (t) => <FileGlyph tone={t} />)}
      <Link label={labels.build} icon={<Hammer size={15} />} lit={on('build')} />
      {stop('image', (t) => <ImageGlyph tone={t} />)}
      <Link label={labels.run} icon={<Play size={15} />} lit={on('run')} />
      {stop('container', (t) => <ContainerGlyph tone={t} />)}
      <Link lit={on('browser')} icon={<Globe size={15} />} w={140} />
      {stop('browser', (t) => <BrowserGlyph tone={t === OFF ? OFF : LAB.navy} />)}
    </div>
  )
}

/** One step under a strip, enlarged into a card: an icon tile and the spec line. `now` rings it, `on` false fades it back. */
function StepCard({ on, now, icon, kind = 'hop', children }: { on: boolean; now: boolean; icon: ReactNode; kind?: string; children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-4 rounded-[16px] px-5 py-3.5"
      style={{
        background: colors.white,
        opacity: on ? 1 : 0.35,
        boxShadow: now ? `0 0 0 3px ${colors.accent}, 0 16px 30px -22px ${colors.accent}` : '0 12px 26px -20px rgba(16,32,58,0.6), inset 0 0 0 1px rgba(16,32,58,0.08)',
        transition: `all 480ms ${EASE}`,
      }}
    >
      <span className="grid shrink-0 place-items-center rounded-[12px]" style={{ width: 50, height: 50, background: now ? colors.accent : colors.brand, color: colors.white, transition: `background 420ms ${EASE}` }}>
        {now && !STILL ? <Fx kind={kind} dur={1.8}>{icon}</Fx> : icon}
      </span>
      <p className="m-0 text-[22px] leading-snug" style={{ color: colors.ink }}>
        {children}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ T11-4 */

/**
 * Steps (the loop, auto ON): 0 the Dockerfile, 1 `docker build` draws (Step 4 now), 2 the image lands
 * (tick badge), 3 Step 5 now, the image listed. Harness URLs hold 3.
 */
export function PartB4({ lesson }: { lesson: string }) {
  const k = useCycle(4, 1900, 3, 3)
  const lit: StopKey[] = k === 0 ? ['file'] : k === 1 ? ['file', 'build'] : ['file', 'build', 'image']
  const now: StopKey = k === 0 ? 'file' : k === 1 ? 'build' : 'image'
  return (
    <Card id="T11-4" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 34 }}>
        <FlowStrip
          lit={lit}
          now={now === 'build' ? undefined : now}
          badges={{
            file: <StopBadge on={k === 0} tone={colors.brand} kind="hop"><FileCode2 size={16} /></StopBadge>,
            image: <StopBadge on={k >= 2} tone={k === 3 ? colors.brand : colors.success} kind="pop">{k === 3 ? <ListChecks size={16} /> : <CheckCircle2 size={16} />}</StopBadge>,
          }}
          labels={{
            file: 'Dockerfile',
            build: <Mono>docker build</Mono>,
            image: 'image',
            run: <Mono>docker run</Mono>,
            container: 'container',
            browser: 'browser output',
          }}
        />
        <div className="flex flex-col" style={{ gap: 14 }}>
          <StepCard on={k >= 1} now={k === 1 || k === 2} icon={<Hammer size={24} />} kind="wrench">
            Step 4: <Mono>docker build -t cloud-docker-demo .</Mono> builds the image
          </StepCard>
          <StepCard on={k >= 3} now={k === 3} icon={<ListChecks size={24} />}>
            Step 5: <Mono>docker images</Mono> confirms <Mono>cloud-docker-demo</Mono> stored locally
          </StepCard>
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-5, T11-6 */

/** One terminal step: icon badge and label, the command line, the full strip capture, its caption in a box with an icon chain. */
function TermStep({ on, step, icon, line, caption, chain, children }: { on: [boolean, boolean]; step: ReactNode; icon: ReactNode; line: ReactNode; caption: ReactNode; chain: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      <div className="flex items-center gap-3">
        <span className="grid shrink-0 place-items-center rounded-[10px]" style={{ width: 34, height: 34, background: colors.brand, color: colors.white }}>
          {on[0] && !STILL ? <Fx kind="hop" dur={2.2}>{icon}</Fx> : icon}
        </span>
        <StepLabel>{step}</StepLabel>
      </div>
      <Line>{line}</Line>
      <Fade on={on[0]}>{children}</Fade>
      <Fade on={on[1]}>
        <CaptionBox icon={<Terminal />} trail={chain}>
          {caption}
        </CaptionBox>
      </Fade>
    </div>
  )
}

/** A wordless icon chain: `from`, a dot travelling the line to `to` (what the caption's output means). */
function Chain({ from, to, run }: { from: ReactNode; to: ReactNode; run: boolean }) {
  const f = fx('flow', 0, 1.8)
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1.5" style={{ color: colors.brand }}>
      <span className="grid place-items-center" style={{ width: 24, height: 24 }}>{from}</span>
      <span className="relative block" style={{ width: 48, height: 24 }}>
        <span className="absolute block rounded-full" style={{ left: 0, right: 0, top: 11, height: 2, background: `${colors.brand}55` }} />
        {run && !STILL && <span className={`absolute block rounded-full ${f.className}`} style={{ ...f.style, ['--dx' as string]: '40px', left: 0, top: 8, width: 8, height: 8, background: colors.accent } as CSSProperties} />}
      </span>
      <span className="grid place-items-center" style={{ width: 24, height: 24 }}>{to}</span>
    </span>
  )
}

/**
 * Step 6 (T11-5) and Step 7 (T11-6), one step per slide (user, 2026-11-04: the merged slide split again,
 * every string kept). Steps on each: the capture, then its caption.
 */
export function PartB5({ lesson }: { lesson: string }) {
  const b = useBuild(2, 900)
  return (
    <Card id="T11-5" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 16 }}>
        <TermStep
          on={[b >= 1, b >= 2]}
          step="Step 6: Container Started"
          icon={<Play size={18} />}
          line={
            <>
              <Mono>docker run -d --name cloud-web -p 8080:80 cloud-docker-demo</Mono> starts it
            </>
          }
          caption={
            <>
              Terminal after <Mono>docker run</Mono>: <Mono>cloud-web</Mono> container ID printed
            </>
          }
          chain={<Chain run={b >= 2} from={<Terminal size={20} />} to={<Box size={20} />} />}
        >
          <Crop name="slide-11-4" highlight={[42, 50, 1076, 36]} maxW={BOX_W} maxH={76} bg={DARK} alt="Terminal after docker run: cloud-web container ID printed" />
        </TermStep>
      </div>
    </Card>
  )
}

export function PartB6({ lesson }: { lesson: string }) {
  const b = useBuild(2, 900)
  return (
    <Card id="T11-6" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 16 }}>
        <TermStep
          on={[b >= 1, b >= 2]}
          step="Step 7: Port Mapping Confirmed"
          icon={<Network size={18} />}
          line={
            <>
              <Mono>docker ps</Mono> expected <Mono>cloud-web</Mono> with <Mono>0.0.0.0:8080-&gt;80/tcp</Mono>
            </>
          }
          caption={
            <>
              <Mono>docker ps</Mono>: <Mono>cloud-web</Mono> mapped to <Mono>0.0.0.0:8080-&gt;80/tcp</Mono>
            </>
          }
          chain={<Chain run={b >= 2} from={<Globe size={20} />} to={<Box size={20} />} />}
        >
          {/* padded with the terminal's own background so the NAMES ring closes inside the frame */}
          <Crop name="slide-11-5" crop={[0, 0, 1614, 81]} highlight={[[1062, 52, 436, 29], [1498, 52, 112, 29]]} maxW={BOX_W} maxH={76} bg={DARK} alt="docker ps: cloud-web mapped to 0.0.0.0:8080->80/tcp" />
        </TermStep>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-7 */

/**
 * 37's layout (corrections 2026-11-03): a wordless strip on top (the card names no stop, so no labels), the
 * browser stop lit, then the step, a rule, the two shots and the caption box.
 * Round 2: no zoom icon between the shots; badge 1 = the address bar, badge 2 = the page heading, on the
 * capture and on the zoom. The zoom frame is wider than before (to x 730) so badge 2 fits beside its ring.
 * Steps: 1 the strip reaches the browser, 2 the full capture, 3 ring + badge 1, 4 the zoom with ring + badge 1,
 * 5 ring + badge 2 on the capture, 6 ring + badge 2 on the zoom, 7 the box.
 */
export function PartB7({ lesson }: { lesson: string }) {
  /* user, 2026-11-04: the capture whole (no zoom copy), larger, its two orange rings kept, no numbers; steps: the strip, the capture, the caption */
  const b = useBuild(3, 900)
  const all: StopKey[] = ['file', 'build', 'image', 'run', 'container', 'browser']
  const caption = (
    <>
      Browser at <Mono>localhost:8080</Mono>: the custom “Hello from Docker!” page
    </>
  )
  return (
    <Card id="T11-7" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 14 }}>
        <FlowStrip
          lit={b >= 1 ? all : ['file', 'build', 'image', 'run', 'container']}
          now={b >= 1 ? 'browser' : undefined}
          badges={{ browser: <StopBadge on={b >= 1} tone={colors.success} kind="pop"><CheckCircle2 size={16} /></StopBadge> }}
        />
        <div className="flex flex-col gap-2">
          <StepLabel>Step 8: Custom Page Verified</StepLabel>
          <Line>browser at port 8080 expected the custom page</Line>
        </div>
        <div className="flex items-center justify-center" style={{ borderTop: `2px solid ${colors.line}`, paddingTop: 12 }}>
          <Fade on={b >= 2}>
            <Crop name="slide-11-6" highlight={[[272, 12, 300, 76], [4, 152, 628, 90]]} maxW={600} maxH={144} alt="Browser at localhost:8080: the custom Hello from Docker! page" />
          </Fade>
        </div>
        <Fade on={b >= 3}>
          <CaptionBox icon={<Globe />}>{caption}</CaptionBox>
        </Fade>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-8 */

/**
 * 37's layout. Steps (the loop, auto ON): 0 every stop lit (it ran), 1 Step 9 now: the container greys out
 * with a bin badge, 2 Step 10 now: the image still listed. Harness URLs hold 2.
 */
export function PartB8({ lesson }: { lesson: string }) {
  const k = useCycle(3, 2200, 2, 2)
  const all: StopKey[] = ['file', 'build', 'image', 'run', 'container', 'browser']
  return (
    <Card id="T11-8" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 34 }}>
        <FlowStrip
          lit={all}
          now={k === 0 ? 'container' : k === 2 ? 'image' : undefined}
          dim={k >= 1 ? ['container'] : []}
          badges={{
            container: <StopBadge on={k >= 1} tone={colors.danger} kind="shake"><Trash2 size={16} /></StopBadge>,
            image: <StopBadge on={k === 2} tone={colors.success} kind="pop"><ListChecks size={16} /></StopBadge>,
          }}
          labels={{ file: 'Dockerfile', build: 'Build', image: 'Image', run: 'Run', container: 'Container', browser: 'browser output' }}
        />
        <div className="flex flex-col" style={{ gap: 14 }}>
          <StepCard on={k >= 1} now={k === 1} icon={<Trash2 size={24} />} kind="shake">
            Step 9: <Mono>docker stop cloud-web</Mono> and <Mono>docker rm cloud-web</Mono> remove it
          </StepCard>
          <StepCard on={k >= 2} now={k === 2} icon={<ListChecks size={24} />}>
            Step 10: <Mono>docker images</Mono> still lists <Mono>cloud-docker-demo</Mono> after removal
          </StepCard>
        </div>
      </div>
    </Card>
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. Every loop here uses the shared `fx` classes, which stop under `.cc-still`, `.deck-thumb` and reduced motion. */
export const BUILD_CSS = ``
