import { useEffect, useState, type ReactNode } from 'react'
import { Cpu, Droplets, FileText, HardDrive, MemoryStick, Zap } from 'lucide-react'
import { colors } from '@/design/tokens'
import { DataTable } from '@/ui'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Label, REDUCED, STILL, Stage, useCycle, useLoop } from '../scene'
import { ClayFlats, ClayMeter, LAB } from '../d3/kit'
import { FLAT_W, FLAT_H } from '../clay-b'
import { AN_W, IsoAnalogy, PointsFigure, lead } from '../iso/frames'
import { ContainerHost, LayerStack, LockGlyph, Slab, STACK, Tile } from './frames'

/**
 * SECTION 1 · CONTAINER FUNDAMENTALS (T01-1 to T03-2). The one container
 * picture (`ContainerHost`) and the one layer stack (`LayerStack`) from this
 * session's frames; every label is a word the card already has.
 *
 * Each figure runs ONE loop whose motion is the card's press sequence:
 *   T01-1   the TR image's stack: the three containers stand on the Container Engine one by one
 *   T01-AN  the pairs light in turn: lock beside namespaces, foundation beside host kernel
 *   T02-1   each namespace box lights and points at the kernel, in the table's row order
 *   T03-1   the three meters' needles rise and fall inside one cgroup box
 *   T03-2   the read-only layers merge into one view, then the writable top layer
 *           takes a copy of the one changed file; the layers under it never change
 * On harness URLs every loop holds its most complete state.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** 0 before a, 1 after b, eased between. */
function within(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return x * x * (3 - 2 * x)
}

/**
 * A sawtooth lap phase, 0 to 1, that STARTS AT 0 when the slide mounts (so the
 * first live frame is the lap's first state and the entrance layer never brings
 * in something the lap then hides), held at `still` on harness URLs, under
 * reduced motion and in picker thumbnails.
 */
function useLap(periodMs: number, still: number) {
  const instant = useInstant()
  const held = STILL || REDUCED || instant
  const [t, setT] = useState(0)
  useEffect(() => {
    if (held) return
    let raf = 0
    let last = -1
    const t0 = performance.now()
    const tick = (now: number) => {
      const q = Math.floor((((now - t0) / periodMs) % 1) * 200)
      if (q !== last) {
        last = q
        setT(q / 200)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [held, periodMs])
  return held ? still : t
}

/* ================================================================== T01-1 · what a container is */

const T01_POINTS = ['Namespaces : limit WHAT a process can see', 'Control groups : limit HOW MUCH it can use', 'Union filesystem : layers that build the image itself']

/* the TR image (shots/slide-01-1.png), its labels exactly: all three apps are "App 1" in the TR */
const T01_APPS = ['App 1', 'App 1', 'App 1']
const COL_W = 118
const COL_GAP = 12
const COLS_W = COL_W * 3 + COL_GAP * 2
const ENGINE_W = COLS_W + 28
const HOSTOS_W = COLS_W + 96
const FAST = 260 // the boxes' own motion, half the deck's 520ms (user, 2026-10-28: "too slow")

function ContainerScene() {
  /* a 4.5s lap (half the old 9s): engine and Host OS enter (by 1.5s), the containers land one by one from 1.6s, the bracket at 3s, a hold */
  const t = useLap(4500, 0.95)
  const stand = t > 0.56 ? 3 : t > 0.46 ? 2 : t > 0.36 ? 1 : 0
  const bracket = t > 0.66
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="relative flex" style={{ gap: COL_GAP }}>
        {/* the dashed bracket on the containers' left, "Containers" turned up its side */}
        <div className="absolute flex items-center" style={{ right: COLS_W + 12, top: 0, bottom: 0, opacity: bracket ? 1 : 0, transition: `opacity ${FAST}ms ${EASE}` }}>
          <span className="whitespace-nowrap font-heading text-[16px] font-semibold" style={{ color: colors.ink, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Containers
          </span>
          <div className="ml-2 self-stretch" style={{ width: 12, borderTop: `2px dashed ${colors.muted}`, borderLeft: `2px dashed ${colors.muted}`, borderBottom: `2px dashed ${colors.muted}`, borderRadius: '4px 0 0 4px' }} />
        </div>
        {T01_APPS.map((a, i) => (
          <div key={i} style={{ opacity: i < stand ? 1 : 0, transform: i < stand ? 'none' : 'translateY(-14px)', transition: `all ${FAST}ms ${EASE}` }}>
            <Tile w={COL_W}>
              <div className="flex flex-col gap-1.5">
                <div className="grid h-[48px] place-items-center rounded-[9px] font-heading text-[16px] font-semibold" style={{ color: colors.ink, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F7FE 100%)', boxShadow: 'inset 0 0 0 1px #CFDCF5' }}>
                  {a}
                </div>
                <div className="grid h-[48px] place-items-center rounded-[9px] font-heading text-[16px] font-semibold" style={{ color: colors.ink, background: 'linear-gradient(180deg, #E9F0FF 0%, #D6E3FB 100%)', boxShadow: 'inset 0 0 0 1px #B9CCF2' }}>
                  libs/bins
                </div>
              </div>
            </Tile>
          </div>
        ))}
      </div>
      <div className="mt-2.5">
        <Slab w={ENGINE_W} fill={STACK.engine}>
          Container Engine
        </Slab>
      </div>
      <div className="mt-2.5">
        <Slab w={HOSTOS_W} h={46} fill={STACK.kernel} size={19}>
          Host OS
        </Slab>
      </div>
      <span className="mt-4 font-heading text-[20px] font-bold" style={{ color: colors.ink }}>
        Containerization
      </span>
    </div>
  )
}

export function Container({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T01-1"
      kicker="Container Isolation Basics"
      title="Process-Level Isolation"
      lead="A container is a running process that shares the host machine's kernel but gets its own isolated view of files, network and other processes, with no separate guest operating system of its own"
      lesson={lesson}
      points={T01_POINTS}
      figure={<ContainerScene />}
    />
  )
}

/* ================================================================== T01-AN · flats in one building */

/* both scenes share one baseline: the foundation and the host kernel sit at the same height */
const AN_SH = 400 // the stage height: with no lead and no captions (user, 2026-10-28) the pictures take the freed space
const AN_SLAB_BOTTOM = 84
const FLATS_W = 340
const FLATS_H = (FLATS_W * FLAT_H) / FLAT_W
const SLAB_W = 380

function FlatsScene({ k }: { k: number }) {
  const left = (AN_W - SLAB_W) / 2
  /* the third flat's padlock, in scene pixels (the clay drawing's door at x + 89..101, y 172..186) */
  const s = FLATS_W / FLAT_W
  const flatsX = (AN_W - FLATS_W) / 2
  const flatsTop = AN_SH - AN_SLAB_BOTTOM - 40 - 8 - FLATS_H
  const lockX = flatsX + (30 + 2 * 124 + 101) * s
  const lockY = flatsTop + 180 * s
  return (
    <>
      <div className="absolute" style={{ left: flatsX, top: flatsTop }}>
        <ClayFlats w={FLATS_W} />
      </div>
      <div className="absolute" style={{ left, bottom: AN_SLAB_BOTTOM }}>
        <Slab w={SLAB_W} fill={STACK.hardware} lit={k === 1}>
          foundation
        </Slab>
      </div>
      <At x={404} y={lockY - 52}>
        <Label size={15} strong tone={k === 0 ? 'solid' : 'plain'}>
          lock
        </Label>
      </At>
      <Arrow x1={418} y1={lockY - 24} x2={lockX + 6} y2={lockY - 4} tone={k === 0 ? colors.brand : colors.muted} />
      <div className="absolute flex justify-center gap-6" style={{ left: 0, right: 0, top: AN_SH - AN_SLAB_BOTTOM + 12 }}>
        <Label size={15} strong icon={<Zap />} tone={k === 1 ? 'solid' : 'plain'}>
          electricity
        </Label>
        <Label size={15} strong icon={<Droplets />} tone={k === 1 ? 'solid' : 'plain'}>
          water line
        </Label>
      </div>
    </>
  )
}

function KernelScene({ k }: { k: number }) {
  const left = (AN_W - SLAB_W) / 2
  /* the third container's lock, centred in its tile */
  const cw = (SLAB_W - 24) / 3
  const lockX = left + 2 * (cw + 12) + cw / 2
  /* the containers' tiles are about 72 tall over a 40 kernel slab with a 10 gap */
  const tileTop = AN_SH - AN_SLAB_BOTTOM - 40 - 10 - 72
  return (
    <>
      <div className="absolute" style={{ left, bottom: AN_SLAB_BOTTOM }}>
        <ContainerHost
          w={SLAB_W}
          litKernel={k === 1}
          top={() => (
            <div className="flex justify-center">
              <LockGlyph size={15} tone={colors.brandDark} />
            </div>
          )}
        />
      </div>
      <At x={lockX} y={tileTop - 72} cx>
        <Label size={15} strong tone={k === 0 ? 'solid' : 'plain'}>
          namespaces
        </Label>
      </At>
      <Arrow x1={lockX} y1={tileTop - 40} x2={lockX} y2={tileTop - 6} tone={k === 0 ? colors.brand : colors.muted} />
    </>
  )
}

/** The pairs light in turn on one clock both scenes read: lock with namespaces, then foundation with host kernel. */
function useAnalogyPair() {
  return useCycle(2, 2600, 0)
}

function FlatsEveryday() {
  return <FlatsScene k={useAnalogyPair()} />
}
function FlatsConcept() {
  return <KernelScene k={useAnalogyPair()} />
}

/**
 * The analogy rule (user, 2026-10-28): no text that describes or explains the
 * visual. `IsoAnalogy` `bare`: no lead sentence, no caption pills, no SAME IDEA
 * words (the arrow stays); only the two pictures and the tags inside them.
 */
export function FlatsAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="T01-AN"
      kicker="Container Isolation Basics"
      title="Flats in one building"
      lesson={lesson}
      bare
      h={AN_SH}
      everyday={{ label: 'Flats in one building', scene: <FlatsEveryday /> }}
      cloud={{ label: 'Containers on one host kernel', scene: <FlatsConcept /> }}
    />
  )
}

/* ================================================================== T02-1 · six namespaces */

const NS_ROWS: [string, string][] = [
  ['PID (process ID)', 'Own process tree, own PID 1'],
  ['Network', 'Own interfaces, IP address, ports'],
  ['Mount', 'Own filesystem view and mount points'],
  ['UTS (UNIX time-sharing)', 'Own hostname and domain name'],
  ['IPC (inter-process communication)', 'Own message queues, semaphores'],
  ['User', 'Own user and group ID mapping'],
]

const TABLE_W = 680
const NS_W = BOX_W - TABLE_W - 24
const NS_H = 340

/** The six names around the kernel, in the table's order, clockwise from the top left. */
const NS_BOXES: { name: string; x: number; y: number; hw: number }[] = [
  { name: 'PID', x: 120, y: 50, hw: 30 },
  { name: 'Network', x: NS_W - 120, y: 50, hw: 48 },
  { name: 'Mount', x: NS_W - 62, y: NS_H / 2, hw: 38 },
  { name: 'UTS', x: NS_W - 120, y: NS_H - 50, hw: 30 },
  { name: 'IPC', x: 120, y: NS_H - 50, hw: 28 },
  { name: 'User', x: 58, y: NS_H / 2, hw: 32 },
]

/** Where a ray from a box's centre leaves a rectangle of half sizes hw x hh. */
function exit(dx: number, dy: number, hw: number, hh: number) {
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const t = Math.min(ux === 0 ? Infinity : hw / Math.abs(ux), uy === 0 ? Infinity : hh / Math.abs(uy))
  return [ux * t, uy * t] as const
}

function NamespaceScene() {
  /* one box at a time, in the row order, then a beat with none lit; held with none lit */
  const lit = useCycle(7, 1500, 6)
  const KX = NS_W / 2
  const KY = NS_H / 2
  const KHW = 56
  const KHH = 46
  return (
    <>
      <At x={KX} y={KY} cx cy>
        <div className="flex flex-col items-center justify-center gap-1 rounded-[18px]" style={{ width: KHW * 2, height: KHH * 2, background: `linear-gradient(180deg, ${LAB.navy} 0%, #1E2C6E 100%)`, boxShadow: '0 14px 26px -14px rgba(16,32,58,0.7)' }}>
          <Cpu size={30} color={colors.white} strokeWidth={1.8} />
          <span className="font-heading text-[16px] font-semibold" style={{ color: colors.white }}>
            Kernel
          </span>
        </div>
      </At>
      {NS_BOXES.map((b, i) => {
        const dx = KX - b.x
        const dy = KY - b.y
        const [sx, sy] = exit(dx, dy, b.hw + 6, 22)
        const [ex, ey] = exit(-dx, -dy, KHW + 8, KHH + 8)
        const on = lit === i
        return (
          <div key={b.name}>
            <Arrow x1={b.x + sx} y1={b.y + sy} x2={KX + ex} y2={KY + ey} tone={on ? colors.brand : '#9FB3D9'} />
            <At x={b.x} y={b.y} cx cy>
              <Label size={16} strong tone={on ? 'solid' : 'plain'} raised>
                {b.name}
              </Label>
            </At>
          </div>
        )
      })}
    </>
  )
}

export function Namespaces({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T02-1"
      kicker="Linux Namespaces"
      title="Isolating Process Views"
      lead={lead('A namespace isolates a process’s view of system resources, so each container gets its own view of processes, networking, and filesystems')}
      lesson={lesson}
    >
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <div style={{ width: TABLE_W }}>
          <DataTable compact columns={[{ label: 'Namespace', weight: 1 }, { label: 'Isolates', weight: 1.08 }]} rows={NS_ROWS} />
        </div>
        <Stage w={NS_W} h={NS_H} active={false}>
          <NamespaceScene />
        </Stage>
      </div>
    </Card>
  )
}

/* ================================================================== T03-1 · control groups */

const T03_LEAD = 'Two more kernel features complete container isolation: control groups, known as cgroups, cap resource use, and a union filesystem builds the image itself from layers'
const T03_POINTS = ['CPU controller: caps processor time share per group', 'Memory controller: breach triggers an out-of-memory kill', 'Block I/O controller: caps disk read and write speed']

const METERS: { name: string; icon: ReactNode; phase: number }[] = [
  { name: 'CPU', icon: <Cpu />, phase: 0 },
  { name: 'Memory', icon: <MemoryStick />, phase: 0.33 },
  { name: 'Disk', icon: <HardDrive />, phase: 0.66 },
]

function CgroupScene() {
  const t = useLoop(8000, { mode: 'sawtooth', still: 0.25, steps: 240 })
  const W = 540
  const H = 250
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="relative rounded-[22px]" style={{ width: W, height: H, background: 'rgba(45,99,251,0.05)', border: `2.5px dashed ${colors.brand}` }}>
        <div className="absolute" style={{ left: 18, top: -16 }}>
          <Label size={16} strong tone="solid">
            cgroup
          </Label>
        </div>
        <div className="absolute inset-x-0 flex justify-around" style={{ top: 40 }}>
          {METERS.map((m) => {
            /* each needle swings up and back on its own offset, never past the top of its dial */
            const u = (t + m.phase) % 1
            const v = 0.2 + 0.6 * (u < 0.5 ? within(u, 0, 0.5) : 1 - within(u, 0.5, 1))
            return (
              <div key={m.name} className="flex flex-col items-center gap-3">
                <ClayMeter w={118} value={v} />
                <Label size={16} strong icon={m.icon}>
                  {m.name}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Cgroups({ lesson }: { lesson: string }) {
  return <PointsFigure id="T03-1" kicker="Cgroups And Union FS" title="Resource Limits Layers" lead={T03_LEAD} lesson={lesson} points={T03_POINTS} figure={<CgroupScene />} />
}

/* ================================================================== T03-2 · union filesystem */

const T032_POINTS = ['Union filesystem merges read-only layers; OverlayFS is the current standard driver', 'Copy-on-write duplicates a file only when it is modified']

/* three read-only layers, top to bottom; the trailing spaces only keep the keys apart (HTML collapses them) */
const UFS_LAYERS = ['Read-only layer', 'Read-only layer ', 'Read-only layer  ']
const UFS_W = 360
const UFS_H = 44
const UFS_GAP = 8

/** A small file: a page icon and the word. */
function FileChip({ tone = 'plain' }: { tone?: 'plain' | 'warn' }) {
  return (
    <Label size={14} strong icon={<FileText />} tone={tone}>
      file
    </Label>
  )
}

function UnionScene() {
  /*
    A 9s lap that starts at 0 on mount, in the visual's logic (user, 2026-10-28: "the arrows appear first"):
    the read-only layers (the entrance layer brings them in by 1.5s), then the One view tile (1.6s), then
    the arrows that join them (2.1s), then the writable top layer with the copied file (2.7s), then the
    Copy-on-write arrow and its label (3.2s); a hold, round again. Held complete on harness URLs.
  */
  const t = useLap(9000, 0.95)
  const view = t > 0.18
  const merge = t > 0.23
  const copy = t > 0.3
  const cow = t > 0.35
  const X = 64
  const VIEW_Y = 18
  const VIEW_H = 50
  const STACK_Y = 106
  /* row tops inside the stack: the writable slab, then the three layers */
  const rowY = (r: number) => STACK_Y + r * (UFS_H + UFS_GAP)
  const FILE_X = X + UFS_W - 86
  return (
    <>
      {/* one view, the merge of every layer under it */}
      <At x={X} y={VIEW_Y}>
        <div style={{ opacity: view ? 1 : 0, transform: view ? 'none' : 'translateY(10px)', transition: `all 520ms ${EASE}` }}>
          <div className="flex items-center justify-center rounded-[16px]" style={{ width: UFS_W, height: VIEW_H, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', boxShadow: `inset 0 0 0 2px ${colors.brand}, 0 12px 22px -16px rgba(16,32,58,0.55)` }}>
            <span className="font-heading text-[18px] font-semibold" style={{ color: colors.brandDark }}>
              One view
            </span>
          </div>
        </div>
      </At>
      {[0.2, 0.5, 0.8].map((f, i) => (
        <Arrow key={i} x1={X + UFS_W * f} y1={STACK_Y - 8} x2={X + UFS_W * f} y2={VIEW_Y + VIEW_H + 6} on={merge} delay={i * 120} />
      ))}
      <At x={X} y={STACK_Y}>
        <LayerStack w={UFS_W} h={UFS_H} layers={UFS_LAYERS} writable={copy ? 'Writable top layer' : undefined} size={16} />
      </At>
      {/* the one changed file: its original stays in its read-only layer, its copy goes up into the writable layer */}
      <At x={FILE_X} y={rowY(2) + 8}>
        <FileChip />
      </At>
      <div className="absolute" style={{ left: FILE_X, top: rowY(0) + 8, opacity: copy ? 1 : 0, transition: `opacity 480ms ${EASE} 200ms` }}>
        <FileChip tone="warn" />
      </div>
      <Arrow x1={X + UFS_W + 18} y1={rowY(2) + 22} x2={X + UFS_W + 18} y2={rowY(0) + 22} on={cow} tone={LAB.orange} />
      <div className="absolute" style={{ left: X + UFS_W + 34, top: rowY(1) + 8, opacity: cow ? 1 : 0, transition: `opacity 480ms ${EASE} 300ms` }}>
        <Label size={16} strong tone="warn">
          Copy-on-write
        </Label>
      </div>
    </>
  )
}

export function UnionFs({ lesson }: { lesson: string }) {
  return <PointsFigure id="T03-2" kicker="Cgroups And Union FS" title="Resource Limits Layers" lesson={lesson} points={T032_POINTS} figure={<UnionScene />} figH={330} />
}
