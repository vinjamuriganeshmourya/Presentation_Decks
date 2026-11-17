import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { BOX_W, Card, Num, STILL } from '../scene'
import { TILE_SKIN } from '../card'
import { ClayBar } from '../d3/kit'
import { LAB } from '../clay-b'

/**
 * THE SESSION'S OWN FRAMES ("Containers vs Virtual Machines"). Everything else
 * comes from the layers sessions 2 and 3 left: `Card`, `Stage`, `Label`, `At`,
 * `Arrow`, `Traveller`, `useLoop`, `useCycle` (`../scene`), `PointsFigure`,
 * `FigureOnly`, `TableCard`, `Tiles`, `IsoAnalogy` (`../iso/frames`), the 3D
 * finish (`Icon3D`, the clay objects, `../d3/kit`).
 *
 *   MARK / Logo     every logo the spec names, imported so the single file inlines them
 *   Mono            a command, file name, flag or image name inside a line (spec design note 1)
 *   shot / Crop     the TR's screenshots from `spec.json`, cropped in source pixels
 *   ShotCard        one screenshot card: the step label, the screenshot, its caption
 *   Slab / Tile     the stack drawings' pieces; ContainerHost, VmHost and LayerStack
 *                   are the ONE container picture and the ONE layer stack the spec
 *                   asks every section to reuse (design notes 3 and 4)
 */

/* ------------------------------------------------------------------ marks */

import docker from './marks/docker.png'
import podman from './marks/podman.png'
import containerd from './marks/containerd.png'
import ubuntu from './marks/ubuntu.png'
import windows from './marks/windows.png'
import macos from './marks/macos.png'
import linux from './marks/linux.png'
import vscode from './marks/vscode.png'
import virtualbox from './marks/virtualbox.png'
import kvm from './marks/kvm.png'
import hyperv from './marks/hyper-v.png'
import vmware from './marks/vmware.png'
import aws from './marks/aws.png'
import azure from './marks/azure.png'
import gcp from './marks/google-cloud.png'
import ec2 from './marks/ec2.svg'

export const MARK = { docker, podman, containerd, ubuntu, windows, macos, linux, vscode, virtualbox, kvm, hyperv, vmware, aws, azure, gcp, ec2 } as const
export type MarkName = keyof typeof MARK

/** One logo at a height, its name under it when given (a logo supports a label, never replaces it: rule 12). */
export function Logo({ name, h = 26, caption, style }: { name: MarkName; h?: number; caption?: string; style?: CSSProperties }) {
  return (
    <span className="inline-flex flex-col items-center gap-1" style={style}>
      <img src={MARK[name]} alt={caption ?? name} draggable={false} className="block w-auto select-none" style={{ height: h }} />
      {caption && (
        <span className="whitespace-nowrap text-[14px] font-medium leading-tight" style={{ color: colors.muted }}>
          {caption}
        </span>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ monospace inside a line */

/** A command, flag, file or image name set in monospace inside running text. The words are the spec's. */
export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[6px] px-1.5 py-[1px] font-mono" style={{ fontSize: '0.9em', background: '#EAF0FD', color: colors.brandDark, fontVariantLigatures: 'none' }}>
      {children}
    </code>
  )
}

/* ------------------------------------------------------------------ screenshots */

/* `shots-hd/`: the TR screenshots at 2x (Lanczos) with a light unsharp mask, so the browser never blur-scales a small source (user, 2026-10-28: "increase screenshot clarity"). Same pictures, same crop numbers: crops stay in SOURCE pixels. */
const SHOTS = import.meta.glob('./shots-hd/*.png', { eager: true, import: 'default' }) as Record<string, string>

/** A TR screenshot by its spec name, `slide-05-1` and so on. */
export const shot = (name: string) => SHOTS[`./shots-hd/${name}.png`]

/** Natural sizes of the TR screenshots, in source pixels (read from the files). */
export const SHOT_SIZE: Record<string, [number, number]> = {
  'slide-05-1': [678, 434], 'slide-05-2': [592, 424], 'slide-05-3': [516, 356], 'slide-05-4': [968, 681],
  'slide-05-5': [351, 268], 'slide-05-6': [409, 315], 'slide-05-7': [1066, 699], 'slide-05-8': [1314, 503],
  'slide-09-1': [1067, 628], 'slide-11-1': [916, 628], 'slide-11-2': [1600, 520], 'slide-11-3': [1600, 311],
  'slide-11-4': [1600, 86], 'slide-11-5': [1600, 81], 'slide-11-6': [1000, 551],
}

export type Rect = [x: number, y: number, w: number, h: number]

/**
 * A screenshot cropped to the part the caption names (content rule 11), scaled
 * to fit `maxW` x `maxH`, never redrawn. `crop` and `highlight` are in SOURCE
 * pixels; the highlight is the red ring the walkthroughs of session 3 used.
 */
/** `bg`: the frame's own colour, shown where a crop reaches past the picture's edge (a dark margin for a terminal capture). */
export function Crop({ name, crop, highlight, maxW, maxH, alt, bg = colors.white, ring = 3 }: { name: string; crop?: Rect; highlight?: Rect | Rect[]; maxW: number; maxH: number; alt: string; bg?: string; ring?: number }) {
  const [W, H] = SHOT_SIZE[name]
  const [x, y, w, h] = crop ?? [0, 0, W, H]
  const s = Math.min(maxW / w, maxH / h)
  const rings = highlight ? (Array.isArray(highlight[0]) ? (highlight as Rect[]) : [highlight as Rect]) : []
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: Math.round(w * s), height: Math.round(h * s), boxShadow: '0 18px 36px -22px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)', background: bg }}>
      {/* the crop is a background, so the element IS the visible window (an oversized clipped <img> read as overflow to qa and video-safe) */}
      <div role="img" aria-label={alt} className="absolute inset-0 select-none" style={{ backgroundImage: `url(${shot(name)})`, backgroundSize: `${W * s}px ${H * s}px`, backgroundPosition: `${-x * s}px ${-y * s}px`, backgroundRepeat: 'no-repeat' }} />
      {rings.map(([hx, hy, hw, hh], i) => (
        <span
          key={i}
          aria-hidden
          className={`absolute rounded-md ${STILL ? '' : 'cv-ring'}`}
          style={{ left: (hx - x) * s, top: (hy - y) * s, width: hw * s, height: hh * s, border: `${ring}px solid ${colors.accent}`, boxShadow: `0 0 0 4px ${colors.accent}30` }}
        />
      ))}
    </div>
  )
}

/**
 * One screenshot card (spec figure `AnnotatedShot`): the kit header, then the
 * step label and its lines in a column on the left, the cropped screenshot on
 * the right, its caption under it. `lines` are any extra spec lines (a step
 * line, a note) shown under the label, in the spec's order.
 */
export function ShotCard({
  id, kicker, title, lesson, lead, step, lines = [], caption, name, crop, highlight, side, maxH = 380, colW = 380, bg, ring,
}: {
  id: string; kicker: string; title: string; lesson: string; lead?: ReactNode; step: ReactNode; lines?: ReactNode[]; caption: ReactNode
  name: string; crop?: Rect; highlight?: Rect | Rect[]; side?: ReactNode; maxH?: number; colW?: number; bg?: string; ring?: number
}) {
  const gap = 36
  const shotW = BOX_W - colW - gap
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap }}>
        <div className="flex flex-col gap-4" style={{ width: colW }}>
          <StepLabel>{step}</StepLabel>
          {lines.map((l, i) => (
            <p key={i} className="text-[18px] leading-snug" style={{ color: colors.ink }}>
              {l}
            </p>
          ))}
          {side}
        </div>
        <figure className="m-0 flex flex-col items-center gap-3" style={{ width: shotW }}>
          <Crop name={name} crop={crop} highlight={highlight} maxW={shotW} maxH={maxH} bg={bg} ring={ring} alt={typeof caption === 'string' ? caption : ''} />
          <figcaption className="text-center text-[17px] font-semibold leading-snug" style={{ color: colors.ink }}>
            {caption}
          </figcaption>
        </figure>
      </div>
    </Card>
  )
}

/** A step's label (`Step 1: Confirm WSL 2 Is Enabled (Windows)`), in the heading face, brand ink. */
export function StepLabel({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <div className="flex items-start gap-2.5">
      {n !== undefined && <Num n={n} size={28} />}
      <span className="font-heading text-[22px] font-bold leading-tight" style={{ color: colors.brandDark }}>
        {children}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ stack pieces */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** The stack colours: one per layer kind, the same on every slide that draws a stack. */
export const STACK = {
  hardware: LAB.charcoal,
  kernel: LAB.navy,
  hypervisor: colors.brand,
  engine: LAB.periwinkle,
  guest: LAB.sky,
  writable: LAB.orange,
  layer: LAB.cobalt,
} as const

/** A layer slab with its name, a raised `ClayBar`, ringed in amber when `lit`, faded when `dim`. */
export function Slab({ w, h = 40, fill, children, lit = false, dim = false, size = 17 }: { w: number; h?: number; fill: string; children: ReactNode; lit?: boolean; dim?: boolean; size?: number }) {
  return (
    <div className="rounded-[16px]" style={{ width: w, opacity: dim ? 0.35 : 1, boxShadow: lit ? `0 0 0 3px ${colors.accent}, 0 10px 22px -12px ${colors.accent}` : '0 10px 20px -14px rgba(16,32,58,0.55)', transition: `all 420ms ${EASE}` }}>
      <ClayBar w={w} h={h} fill={fill}>
        <span className="font-heading font-semibold" style={{ fontSize: size, color: colors.white }}>
          {children}
        </span>
      </ClayBar>
    </div>
  )
}

/** A raised white tile (a container, a VM, a box in a diagram). `lit` lifts it with a brand ring. */
export function Tile({ w, h, children, lit = false, dim = false, style, className = '' }: { w?: number | string; h?: number; children: ReactNode; lit?: boolean; dim?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div
      className={`rounded-[14px] p-2 ${className}`}
      style={{
        width: w,
        height: h,
        ...TILE_SKIN,
        boxShadow: `${TILE_SKIN.boxShadow}${lit ? `, 0 0 0 3px ${colors.brand}55` : ''}`,
        transform: lit ? 'translateY(-3px)' : 'none',
        opacity: dim ? 0.35 : 1,
        transition: `all 420ms ${EASE}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** A small word chip inside a tile (`App 1`, `Guest OS`, a tag). */
export function Chip({ children, tone = 'app', size = 15, lit = false }: { children: ReactNode; tone?: 'app' | 'os' | 'tag'; size?: number; lit?: boolean }) {
  const look: CSSProperties =
    tone === 'app'
      ? { background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: `inset 0 0 0 ${lit ? 2 : 1}px ${lit ? colors.accent : '#CFDCF5'}` }
      : tone === 'os'
        ? { background: 'linear-gradient(180deg, #E9F0FF 0%, #D6E3FB 100%)', boxShadow: `inset 0 0 0 ${lit ? 2 : 1}px ${lit ? colors.accent : '#B9CCF2'}` }
        : { background: '#FFF1D6', color: '#9A5B00', boxShadow: `inset 0 0 0 ${lit ? 2 : 1}px ${lit ? colors.accent : '#F5D9A6'}` }
  return (
    <div className="grid place-items-center rounded-[9px] px-2 py-1.5 text-center font-heading font-semibold leading-none" style={{ fontSize: size, color: tone === 'tag' ? '#9A5B00' : colors.ink, transition: `box-shadow 300ms ${EASE}`, ...look }}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ the one container picture */

/**
 * Containers on ONE host kernel (T01-1, reused by T12-1, T15-1, T16-1): a row
 * of container tiles, each holding its app, standing on one kernel slab, on
 * the hardware when `hardware` is given. No container has an OS of its own.
 * `show` is how many containers stand (for an entrance), `top(i)` renders
 * anything above a container's app (a lock, tags), `engine` adds the
 * container-engine slab between the containers and the kernel.
 */
export function ContainerHost({
  w, apps = ['App 1', 'App 2', 'App 3'], show, kernel = 'Host kernel', engine, hardware, top, lit = -1, litKernel = false, gap = 12,
}: {
  w: number; apps?: string[]; show?: number; kernel?: string; engine?: string; hardware?: string; top?: (i: number) => ReactNode; lit?: number; litKernel?: boolean; gap?: number
}) {
  const n = apps.length
  const cw = (w - gap * (n - 1)) / n
  const shown = show ?? n
  return (
    <div className="flex flex-col" style={{ width: w, gap: 10 }}>
      <div className="flex items-end" style={{ gap }}>
        {apps.map((a, i) => (
          <div key={a} style={{ width: cw, opacity: i < shown ? 1 : 0, transform: i < shown ? 'none' : 'translateY(-14px)', transition: `all 520ms ${EASE} ${i * 90}ms` }}>
            <Tile w={cw} lit={i === lit}>
              <div className="flex flex-col gap-1.5">
                {top?.(i)}
                <Chip>{a}</Chip>
              </div>
            </Tile>
          </div>
        ))}
      </div>
      {engine && <Slab w={w} fill={STACK.engine}>{engine}</Slab>}
      <Slab w={w} fill={STACK.kernel} lit={litKernel}>{kernel}</Slab>
      {hardware && <Slab w={w} fill={STACK.hardware}>{hardware}</Slab>}
    </div>
  )
}

/**
 * VMs on a hypervisor (T12-1, T15-1, T16-1): each VM tile holds its app on its
 * OWN guest OS, the tiles stand on the hypervisor, on the hardware.
 */
export function VmHost({
  w, apps = ['App 1', 'App 2', 'App 3'], guest = 'Guest OS', hypervisor = 'Hypervisor', hardware = 'Hardware', show, lit = -1, dim = -1, gap = 12, top,
}: {
  w: number; apps?: string[]; guest?: string; hypervisor?: string; hardware?: string; show?: number; lit?: number; dim?: number; gap?: number; top?: (i: number) => ReactNode
}) {
  const n = apps.length
  const cw = (w - gap * (n - 1)) / n
  const shown = show ?? n
  return (
    <div className="flex flex-col" style={{ width: w, gap: 10 }}>
      <div className="flex items-end" style={{ gap }}>
        {apps.map((a, i) => (
          <div key={a} style={{ width: cw, opacity: i < shown ? 1 : 0, transform: i < shown ? 'none' : 'translateY(-14px)', transition: `all 520ms ${EASE} ${i * 90}ms` }}>
            <Tile w={cw} lit={i === lit} dim={i === dim}>
              <div className="flex flex-col gap-1.5">
                {top?.(i)}
                <Chip>{a}</Chip>
                <Chip tone="os">{guest}</Chip>
              </div>
            </Tile>
          </div>
        ))}
      </div>
      <Slab w={w} fill={STACK.hypervisor}>{hypervisor}</Slab>
      <Slab w={w} fill={STACK.hardware}>{hardware}</Slab>
    </div>
  )
}

/* ------------------------------------------------------------------ the one layer stack */

/**
 * Read-only image layers with an optional writable top (T03-2, T06-1, T10-1,
 * T10-2): `layers` are listed TOP to BOTTOM, each a slab with a lock; `writable`
 * adds the orange writable layer on top; `ticks` puts a cache tick on the
 * named layers; `shown` hides the layers past that count from the BOTTOM up
 * (a stack that grows as the build runs).
 */
export function LayerStack({
  w, layers, writable, ticks, shown, lit = -1, h = 40, size = 16,
}: {
  w: number; layers: string[]; writable?: string; ticks?: boolean[]; shown?: number; lit?: number; h?: number; size?: number
}) {
  const n = layers.length
  const visible = shown ?? n
  return (
    <div className="flex flex-col" style={{ width: w, gap: 8 }}>
      <div style={{ opacity: writable ? 1 : 0, transform: writable ? 'none' : 'translateY(-10px)', transition: `all 520ms ${EASE}` }}>
        <Slab w={w} h={h} fill={STACK.writable} size={size}>
          {writable ?? ' '}
        </Slab>
      </div>
      {layers.map((l, i) => {
        const fromBottom = n - 1 - i
        const on = fromBottom < visible
        return (
          <div key={l} className="relative" style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-10px)', transition: `all 520ms ${EASE}` }}>
            <Slab w={w} h={h} fill={STACK.layer} lit={i === lit} size={size}>
              <span className="inline-flex items-center gap-2">
                {/* the lock as tall as the capitals, a block box, so lock and words share one line and one baseline (user, 2026-10-28) */}
                <span className="block"><LockGlyph size={size * 0.58} /></span>
                {l}
              </span>
            </Slab>
            {ticks && (
              <span
                aria-hidden
                className="absolute grid place-items-center rounded-full"
                style={{ right: -40, top: h / 2 - 14, width: 28, height: 28, background: ticks[i] ? colors.success : '#D5DCE8', color: colors.white, transition: `background 420ms ${EASE}` }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5L11 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** A small white padlock for a read-only layer or a container's lock (spec: "a small lock icon"). */
export function LockGlyph({ open = false, size = 14, tone = colors.white }: { open?: boolean; size?: number; tone?: string }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 14 16" fill="none" aria-hidden style={{ display: 'block' }}>
      <path d={open ? 'M4 7V4.5a3 3 0 0 1 5.8-1' : 'M4 7V4.5a3 3 0 0 1 6 0V7'} stroke={tone} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="2" y="7" width="10" height="8" rx="2" fill={tone} />
    </svg>
  )
}

/** The screenshot highlight breathes in the template orange (user, 2026-10-28: highlights orange, not red). */
export const CV_CSS = `
@keyframes cv-ring { 0%, 100% { box-shadow: 0 0 0 4px rgba(255,138,61,0.22) } 50% { box-shadow: 0 0 0 9px rgba(255,138,61,0.09) } }
.cv-ring { animation: cv-ring 1.6s cubic-bezier(0.22,1,0.36,1) infinite }
@media (prefers-reduced-motion: reduce) { .cv-ring { animation: none } }
.cc-still .cv-ring, .deck-thumb .cv-ring { animation: none }
`
