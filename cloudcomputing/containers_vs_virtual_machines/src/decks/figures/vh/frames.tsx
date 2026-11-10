import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Callout } from '@/ui'
import { BOX_W, Card, Label, Num, Stage, useCycle, STILL } from '../scene'
import { lead as leadNode } from '../iso/frames'

/**
 * THE SESSION'S OWN FRAMES ("Virtualization & Hypervisors"). Everything else a
 * slide needs comes from session 2's layer: `Card`, `Stage`, `Label`, `At`,
 * `Arrow`, `Traveller`, `useLoop`, `useCycle` (`../scene`), `PointsFigure`,
 * `FigureOnly`, `TableCard`, `Tiles`, `Mark`, `Chips` (`../iso/frames`), and
 * the 3D finish, `Icon3D` and session 1's clay objects (`../d3/kit`).
 *
 *   MARK          the reference's own embedded marks, imported so the single
 *                 file inlines them (a runtime `/assets/...` path is invisible
 *                 to the inliner: session 2 shipped seven broken images that way)
 *   PairAnalogy   the reference's analogy grammar: EVERYDAY and IN THE CLOUD
 *                 scenes with numbered markers, three mapping pairs under them,
 *                 lit in turn on one clock that the scenes also read
 *   Shot / Shots  the walkthrough frames: the TR's screenshots, two a frame,
 *                 a numbered caption under each (the reference's `Lo`)
 */

/* ------------------------------------------------------------------ marks */

import vmware from './marks/vmware.png'
import hyperv from './marks/hyper-v.png'
import kvm from './marks/kvm.png'
import virtualbox from './marks/virtualbox.png'
import parallels from './marks/parallels.png'
import xen from './marks/xen.png'
import intel from './marks/intel.png'
import amd from './marks/amd.png'
import aws from './marks/aws.png'
import ec2 from './marks/ec2.svg'
import ebs from './marks/ebs.svg'
import vpc from './marks/vpc.svg'
import workspaces from './marks/workspaces.svg'
import appstream from './marks/appstream.png'
import ebsSnapshot from './marks/ebs-snapshot.svg'
import ec2Ami from './marks/ec2-ami.svg'

/** Every mark the reference draws, by what it names. `aws` is the reference's AppStream 2.0 and Nitro mark. */
export const MARK = { vmware, hyperv, kvm, virtualbox, parallels, xen, intel, amd, aws, ec2, ebs, vpc, workspaces, appstream, ebsSnapshot, ec2Ami } as const
export type MarkName = keyof typeof MARK

/** One mark at a height, its name under it when given (the reference's `ESXi`, `KVM`, `Nitro` captions). */
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

/* ------------------------------------------------------------------ the analogy frame */

export const PA_W = 500
export const PA_H = 270
const PA_MID = BOX_W - PA_W * 2

/** A numbered marker on an analogy scene; `on` when its pair is the lit one. Place it with `At`. */
export function Marker({ n, on }: { n: number; on: boolean }) {
  return (
    <span
      className="grid place-items-center rounded-full font-heading text-[15px] font-bold"
      style={{
        width: 30,
        height: 30,
        background: on ? colors.brand : colors.brandDeep,
        color: colors.white,
        boxShadow: on ? `0 0 0 6px ${colors.brand}33` : '0 4px 10px -4px rgba(16,32,58,0.5)',
        transform: on ? 'scale(1.12)' : 'none',
        transition: 'all 420ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {n}
    </span>
  )
}

function Tag({ children, cloud }: { children: ReactNode; cloud?: boolean }) {
  return (
    <span className="rounded-md px-2 py-0.5 font-heading text-[14px] font-bold tracking-[0.08em]" style={cloud ? { background: colors.brand, color: colors.white } : { background: '#FFF1D6', color: '#9A5B00' }}>
      {children}
    </span>
  )
}

/**
 * The reference's analogy slide in the 3D finish. `everyday.scene` and
 * `cloud.scene` are functions of `lit` (0, 1 or 2, the pair on screen; it
 * advances every 3.2s, held on 1 on harness URLs) so a scene can lift the
 * object its marker names. Each scene places its own `Marker`s.
 */
export function PairAnalogy({
  id,
  kicker,
  title,
  lesson,
  everyday,
  cloud,
  pairs,
}: {
  id: string
  kicker: string
  title: string
  lesson: string
  everyday: { label: string; scene: (lit: number) => ReactNode }
  cloud: { label: string; scene: (lit: number) => ReactNode }
  pairs: [string, string][]
}) {
  const lit = useCycle(pairs.length, 3200, 1)
  return (
    <Card id={id} kicker={kicker} title={title} lesson={lesson}>
      <div className="flex items-end" style={{ width: BOX_W }}>
        <div className="flex flex-col gap-2.5" style={{ width: PA_W }}>
          <div className="flex items-center gap-2.5">
            <Tag>EVERYDAY</Tag>
            <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
              {everyday.label}
            </span>
          </div>
          <Stage w={PA_W} h={PA_H} active={false}>
            <div role="img" aria-label={everyday.label} className="absolute inset-0">
              {everyday.scene(lit)}
            </div>
          </Stage>
        </div>
        <div className="grid place-items-center" style={{ width: PA_MID, height: PA_H }}>
          <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: colors.brand, boxShadow: `0 8px 18px -8px ${colors.brand}` }} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h11M11 5l5 5-5 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="flex flex-col gap-2.5" style={{ width: PA_W }}>
          <div className="flex items-center gap-2.5">
            <Tag cloud>IN THE CLOUD</Tag>
            <span className="font-heading text-[18px] font-semibold" style={{ color: colors.ink }}>
              {cloud.label}
            </span>
          </div>
          <Stage w={PA_W} h={PA_H} active={false}>
            <div role="img" aria-label={cloud.label} className="absolute inset-0">
              {cloud.scene(lit)}
            </div>
          </Stage>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4" style={{ width: BOX_W }}>
        {pairs.map(([a, b], i) => (
          <div
            key={a}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
            style={{
              background: i === lit ? colors.surface2 : colors.white,
              boxShadow: `inset 0 0 0 ${i === lit ? 2 : 1}px ${i === lit ? colors.brand : '#D5E1F7'}, 0 8px 18px -14px rgba(16,32,58,0.4)`,
              transition: 'all 420ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <Num n={i + 1} size={26} />
            <span className="text-[16px] leading-snug" style={{ color: colors.ink }}>
              {a}
            </span>
            <span aria-hidden className="shrink-0" style={{ color: colors.brand }}>
              →
            </span>
            <span className="font-heading text-[16px] font-semibold leading-snug" style={{ color: colors.brandDark }}>
              {b}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ screenshot walkthrough */

const SHOTS = import.meta.glob('./shots/*.png', { eager: true, import: 'default' }) as Record<string, string>

/** A TR capture by its reference name, `vbox-01-precheck-virtualization` and so on. */
export const shot = (name: string) => SHOTS[`./shots/${name}.png`]

/**
 * One screenshot in a white frame with its numbered caption, the reference's
 * `Lo`: the image fits a `w` x `h` box keeping its own shape; `highlight` is
 * the reference's red box, in percent of the image.
 */
export function Shot({ n, name, caption, highlight, w = 540, h = 372 }: { n: number; name: string; caption: string; highlight?: { left: number; top: number; width: number; height: number }; w?: number; h?: number }) {
  return (
    <figure className="m-0 flex flex-col items-center" style={{ width: w }}>
      <div className="grid place-items-center" style={{ width: w, height: h }}>
        <div className="relative max-h-full max-w-full overflow-hidden rounded-xl" style={{ boxShadow: '0 18px 36px -22px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)', maxWidth: w, maxHeight: h }}>
          <img src={shot(name)} alt={caption} draggable={false} className="block select-none" style={{ maxWidth: w, maxHeight: h, width: 'auto', height: 'auto' }} />
          {highlight && (
            <span
              aria-hidden
              className={`absolute rounded-md ${STILL ? '' : 'vh-ring'}`}
              style={{ left: `${highlight.left}%`, top: `${highlight.top}%`, width: `${highlight.width}%`, height: `${highlight.height}%`, border: `3px solid ${colors.danger}`, boxShadow: `0 0 0 4px ${colors.danger}30` }}
            />
          )}
        </div>
      </div>
      <figcaption className="mt-3 flex items-start gap-2.5">
        <Num n={n} size={26} />
        <span className="pt-0.5 text-[17px] font-semibold leading-snug" style={{ color: colors.ink }}>
          {caption}
        </span>
      </figcaption>
    </figure>
  )
}

/** The reference's "Important note" callout (slides 41 and 42). */
export function ImportantNote({ children, width, vbox = false }: { children: ReactNode; width?: number; vbox?: boolean }) {
  /* `vbox`: the VirtualBox mark in white as the icon, as the reference's slide 41 has it */
  const icon = vbox ? <img src={MARK.virtualbox} alt="" draggable={false} style={{ width: 18, height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} /> : undefined
  return (
    <div style={{ width }}>
      <Callout kind="warning" title="Important note" asStep={false} icon={icon} className="!p-4 [&_p]:text-[17px] [&>div>div]:text-[17px]">
        {children}
      </Callout>
    </div>
  )
}

/** A walkthrough slide: the kit header, an optional lead, then the shots side by side (and an optional note). */
export function Shots({ id, kicker, title, lead, lesson, side, children }: { id: string; kicker: string; title: string; lead?: string; lesson: string; side?: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead ? leadNode(lead) : undefined} lesson={lesson}>
      <div className={`flex justify-center gap-10 ${side ? "items-center" : "items-start"}`} style={{ width: BOX_W }}>
        {side}
        {children}
      </div>
    </Card>
  )
}

/** The highlight ring breathes, once a second and a half, so the eye finds it. */
export const VH_CSS = `
@keyframes vh-ring { 0%, 100% { box-shadow: 0 0 0 4px rgba(229,72,77,0.19) } 50% { box-shadow: 0 0 0 9px rgba(229,72,77,0.08) } }
.vh-ring { animation: vh-ring 1.6s cubic-bezier(0.22,1,0.36,1) infinite }
@media (prefers-reduced-motion: reduce) { .vh-ring { animation: none } }
.cc-still .vh-ring, .deck-thumb .vh-ring { animation: none }
`

/* re-exported so a section file has one import for the session's frames */
export { Label }
