import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop } from '@/engine/icons3d'
import { EASE, ORANGE, Frame, Plinth, MarkTile, Panel, Wire, Junction, Show, Token, useHot, useHeld, keyframes, tag, heading, type Pt } from '@/engine/figkit'
import ec2Inst from '../images/res-ec2-instance.svg'
import ebsVol from '../images/res-ebs-volume.svg'
import ebsSnap from '../images/res-ebs-snapshot.svg'
import ebsMark from '../images/aws-ebs.svg'
import s3Mark from '../images/aws-s3.svg'
import s3Bucket from '../images/res-s3-bucket.svg'
import kmsMark from '../images/aws-kms.svg'
import trailMark from '../images/aws-cloudtrail.svg'
import rdsMark from '../images/aws-rds.svg'
import rdsInst from '../images/res-rds-instance.svg'
import dekMark from '../images/res-iam-data-encryption-key.svg'
import encMark from '../images/res-iam-encrypted-data.svg'

/*
 * SESSION 15 · SECTION 4 (Encryption at Rest, Client vs Server Side) technical figures, builder C.
 * Built to generate-slides standing correction 17: 3D icons on plinth tiles, official marks on white tiles, >= 20 px
 * equal padding, orthogonal wires computed from the same constants as the boxes, a flow dot on every wire, a lit item
 * walking first -> last -> first after the build. Loops are transform / opacity on HTML elements only. Held (?still):
 * the full final state, nothing lit, nothing moving. Class prefix `t15c-`.
 *
 *   slide 25 C_T14   546 x 330  Volume / Bucket / Database cards, padlocks, the server-side / client-side bar (4)
 *   slide 26 C_T15   546 x 330  instance -> EBS volume (ciphertext blocks) -> snapshot; flag, inherited shading (3)
 *   slide 27 C_T15B  566 x 380  unencrypted volume -> snapshot -> copy -> encrypted volume; Create Volume panel (2)
 *   slide 28 C_T16   546 x 330  upload into the bucket, SSE-S3 / SSE-KMS keys, the default switch, CloudTrail, Properties (4)
 *   slide 29 C_T17   546 x 330  RDS fans out locked backups, snapshots, replicas; a cross-Region replica with its key (2)
 *   slide 30 C_T17B  566 x 380  database -> snapshot -> copy -> restore -> encrypted database; Create Database panel (2)
 *   slide 32 C_T18B 1080 x 420  server-side and client-side flows, plaintext -> data key -> ciphertext (2)
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t15c')
const BLUE = colors.brand
const RIM = 'inset 0 0 0 1.5px #D3DEF6'
const LIT_RING = `inset 0 0 0 2.5px ${ORANGE}, 0 10px 22px -12px rgba(255,138,61,0.7)`

const stepOf = (p: Record<string, unknown>) => Number(p.step ?? 0)
const box = (x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })
const cv = (t: number, d = 0) => ({ ['--t15c-t' as string]: `${t}s`, ['--t15c-d' as string]: `${-d}s` }) as CSSProperties
/** a loop class, or none on held frames */
const lc = (run: boolean, name: string) => (run ? `t15c-l t15c-${name}` : undefined)

/** a tile + tag group whose TILE centre is (x, y); `up` puts the tag above the tile */
function Node({ x, y, size, label, children, w = 120, on = true, delay = 0, tagSize = 13.5, up = false, gap = 5, z = 3 }: { x: number; y: number; size: number; label?: string; children: ReactNode; w?: number; on?: boolean; delay?: number; tagSize?: number; up?: boolean; gap?: number; z?: number }) {
  const t = label ? <span style={{ ...tag(tagSize), [up ? 'marginBottom' : 'marginTop']: gap }}>{label}</span> : null
  return (
    <Show on={on} delay={delay} style={{ position: 'absolute', left: x - w / 2, width: w, zIndex: z, display: 'flex', flexDirection: up ? 'column-reverse' : 'column', alignItems: 'center', ...(up ? { bottom: `calc(100% - ${y + size / 2}px)` } : { top: y - size / 2 }) }}>
      <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', position: 'relative' }}>{children}</div>
      {t}
    </Show>
  )
}

/** a 3D icon on its plinth */
const Tile = ({ name, size = 52, k = 0.72, loop = 'bob', d = 0, lit = false, warm = false }: { name: Ico3DName; size?: number; k?: number; loop?: Loop; d?: number; lit?: boolean; warm?: boolean }) => (
  <Plinth size={size} lit={lit} warm={warm}><Ico3D name={name} size={Math.round(size * k)} loop={loop} d={d} /></Plinth>
)

/** a small round badge holding a 3D icon on a tile's lower-right (or upper-right) corner */
function Corner({ name, size = 22, on = true, loop = 'pulse', d = 0, top = false, children }: { name?: Ico3DName; size?: number; on?: boolean; loop?: Loop; d?: number; top?: boolean; children?: ReactNode }) {
  const instant = useInstant()
  return (
    <span style={{ position: 'absolute', right: -size * 0.34, ...(top ? { top: -size * 0.3 } : { bottom: -size * 0.3 }), width: size + 4, height: size + 4, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6)', display: 'grid', placeItems: 'center', opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 420ms ${EASE}, transform 520ms ${EASE}`, zIndex: 4 }}>
      {children ?? (name && <Ico3D name={name} size={size} loop={loop} d={d} t={2.4} />)}
    </span>
  )
}

/** a padlock that clicks shut once per `period` (an open padlock fades into the shut one, which pops); held: shut */
function ClickLock({ size = 22, run, period = 4.5, d = 0 }: { size?: number; run: boolean; period?: number; d?: number }) {
  return (
    <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: size, height: size }}>
      <span className={lc(run, 'unl')} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0, ...cv(period, d) }}><Ico3D name="unlock" size={size} loop="none" /></span>
      <span className={lc(run, 'shut')} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...cv(period, d) }}><Ico3D name="lock" size={size} loop="none" /></span>
    </span>
  )
}

/** an icon token on a white disc riding a `ride` class (placed from the frame's 0,0); nothing on held frames */
function IconTok({ cls, name, on = true, size = 26 }: { cls: string; name: Ico3DName; on?: boolean; size?: number }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: `${RIM}, 0 6px 12px -6px rgba(31,64,140,0.7)`, opacity: 0 }}>
        <Ico3D name={name} size={size - 8} loop="none" />
      </span>
    </span>
  )
}

/** wires drawn above the white frames they cross */
const Above = ({ children }: { children: ReactNode }) => <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>{children}</div>

/* the stored blocks: a white (plain) face and a shaded (ciphertext) face */
const CIPHER_BG = `repeating-linear-gradient(135deg, rgba(255,255,255,0.22) 0 2px, rgba(255,255,255,0) 2px 6px), linear-gradient(180deg, #5A86FF 0%, ${BLUE} 55%, ${colors.brandDark} 100%)`
function Blocks({ x, y, n, size = 22, gap = 6, cipher, run = false, on = true, delay = 0 }: { x: number; y: number; n: number; size?: number; gap?: number; cipher: boolean; run?: boolean; on?: boolean; delay?: number }) {
  return (
    <Show on={on} delay={delay} style={box(x, y, n * size + (n - 1) * gap, size, { zIndex: 3, display: 'flex', gap })}>
      {Array.from({ length: n }, (_, k) => (
        <span key={k} style={{ position: 'relative', width: size, height: size, borderRadius: 6, background: '#FFFFFF', boxShadow: `${RIM}, 0 6px 10px -8px rgba(31,64,140,0.6)` }}>
          {cipher && <span className={lc(run, `ck${k}`)} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: CIPHER_BG }} />}
        </span>
      ))}
    </Show>
  )
}

/** a blurred field (rule 53: a value the TR does not give is shown blurred) */
const Blur = ({ w, h = 9, c = '#B9C6E0' }: { w: number | string; h?: number; c?: string }) => <span style={{ display: 'block', width: w, height: h, borderRadius: 5, background: c, filter: 'blur(2px)' }} />

/**
 * A DRAWN CONSOLE PANEL in the deck's style: a title bar with the service mark, two blurred form rows (values the TR
 * does not give), and the one row the TR names: a checkbox and its label. The tick pops in once per loop.
 */
function Console({ x, y, w, h, mark, title, label, on, lit, run }: { x: number; y: number; w: number; h: number; mark: string; title: string; label: string; on: boolean; lit: boolean; run: boolean }) {
  const instant = useInstant()
  const fieldRow = (a: number, b: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', columnGap: 16 }}>
      <Blur w={a} />
      <div style={{ height: 32, borderRadius: 8, boxShadow: RIM, display: 'flex', alignItems: 'center', padding: '0 12px' }}><Blur w={b} c="#CFD8EA" /></div>
    </div>
  )
  return (
    <Show on={on} style={box(x, y, w, h, { zIndex: 3 })}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', background: '#FFFFFF', boxShadow: `${RIM}, 0 16px 30px -18px rgba(31,64,140,0.5)` }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: 'linear-gradient(180deg, #F7F9FF 0%, #E9F0FD 100%)', boxShadow: `inset 0 -1px 0 ${colors.line}` }}>
          <MarkTile src={mark} size={32} scale={0.72} />
          <span style={heading(17)}>{title}</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fieldRow(96, '58%')}
          {fieldRow(76, '42%')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44, padding: '0 14px', borderRadius: 10, background: '#F7F9FF', boxShadow: lit ? LIT_RING : `inset 0 0 0 1.5px ${colors.line}`, transition: instant ? 'none' : `box-shadow 420ms ${EASE}` }}>
            <span style={{ position: 'relative', width: 22, height: 22, borderRadius: 6, background: '#FFFFFF', boxShadow: 'inset 0 0 0 2px #95A2B8' }}>
              <span className={lc(run, 'tick')} style={{ position: 'absolute', inset: 0, borderRadius: 6, background: `linear-gradient(180deg, #5A86FF 0%, ${BLUE} 100%)`, display: 'grid', placeItems: 'center', ...cv(3.6) }}>
                <svg aria-hidden width={14} height={14} viewBox="0 0 14 14"><path d="M 2.5 7.5 L 5.8 10.5 L 11.5 3.8" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </span>
            <span style={heading(16)}>{label}</span>
          </div>
        </div>
      </div>
    </Show>
  )
}

/* ================================================================== slide 25 · C_T14 · the storage landscape */

/*
 * 546 x 330. Three cards in a row, y 20..240: Volume (x 20, w 146), Bucket (x 180, w 146), Database (x 340, w 186, wide
 * enough for its two children). In each: the name on top (y 40), the main tile (y 96) with its padlock, and what it
 * holds below (y 180): the Instance whose disk it is, the Files written to the bucket, the database's Backups and
 * Replicas fanned out from a junction (y 142). The Server-Side / Client-Side bar spans all three, y 258..310.
 */
const LS = { W: 546, H: 330, Y: 20, CH: 220, TY: 40, MY: 96, MS: 56, CY: 180, CS: 40, J: 142, BY: 258, BH: 52, FAN: 46 }
const LS_X = [20, 180, 340]
const LS_W = [146, 146, 186]
const LS_C = LS_X.map((x, i) => x + LS_W[i] / 2)
const LS_MB = LS.MY + LS.MS / 2
const LS_CT = LS.CY - LS.CS / 2
const LS_UP = [0, 1].map((i) => K.ride(`ls${i}`, [[LS_C[i], LS_CT], [LS_C[i], LS_MB]], 0.2, 1.0, 2.6))
const LS_FAN = [-1, 1].map((sg, i) => K.ride(`lsf${i}`, [[LS_C[2], LS_MB], [LS_C[2], LS.J], [LS_C[2] + sg * LS.FAN, LS.J], [LS_C[2] + sg * LS.FAN, LS_CT]], 0.2, 1.2, 2.6))

const C_T14: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(4, step, 1700)
  const s = (n: number) => held || step >= n
  const main: { name: Ico3DName; title: string }[] = [
    { name: 'disk', title: 'Volume' },
    { name: 'bucket', title: 'Bucket' },
    { name: 'database', title: 'Database' },
  ]
  return (
    <Frame w={LS.W} h={LS.H}>
      {LS_X.map((x, i) => <Panel key={i} x={x} y={LS.Y} w={LS_W[i]} h={LS.CH} lit={hot === i} />)}
      {main.map((m, i) => (
        <div key={m.title} style={{ position: 'absolute', left: LS_X[i], width: LS_W[i], top: LS.TY, zIndex: 3, ...heading(16), textAlign: 'center' }}>{m.title}</div>
      ))}
      {main.map((m, i) => (
        <Node key={i} x={LS_C[i]} y={LS.MY} size={LS.MS}>
          <Tile name={m.name} size={LS.MS} d={i * 0.4} />
          <Corner size={22}><Ico3D name="lock" size={20} loop="pulse" d={i * 0.6} t={2.4} /></Corner>
        </Node>
      ))}

      {/* what each holds: the instance writes to its disk, files are written to the bucket, the database fans out */}
      <Above>
        <Wire pts={[[LS_C[0], LS_CT], [LS_C[0], LS_MB]]} on={s(1)} head={9} lit={hot === 0} />
        <Wire pts={[[LS_C[1], LS_CT], [LS_C[1], LS_MB]]} on={s(2)} head={9} lit={hot === 1} />
        <Wire pts={[[LS_C[2], LS_MB], [LS_C[2], LS.J]]} on={s(3)} head={0} lit={hot === 2} />
        {[-1, 1].map((sg) => <Wire key={sg} pts={[[LS_C[2], LS.J], [LS_C[2] + sg * LS.FAN, LS.J], [LS_C[2] + sg * LS.FAN, LS_CT]]} on={s(3)} head={9} lit={hot === 2} delay={150} />)}
      </Above>
      <Junction x={LS_C[2]} y={LS.J} on={s(3)} lit={hot === 2} />
      <Node x={LS_C[0]} y={LS.CY} size={LS.CS} label="Instance" on={s(1)} tagSize={12.5}><MarkTile src={ec2Inst} size={LS.CS} /></Node>
      <Node x={LS_C[1]} y={LS.CY} size={LS.CS} label="Files" on={s(2)} tagSize={12.5}><Tile name="doc" size={LS.CS} d={0.5} /></Node>
      {(['Backups', 'Replicas'] as const).map((l, k) => (
        <Node key={l} x={LS_C[2] + (k ? 1 : -1) * LS.FAN} y={LS.CY} size={LS.CS} label={l} w={84} on={s(3)} delay={k * 120} tagSize={12.5}>
          <Tile name={k ? 'replica' : 'snapshot'} size={LS.CS} k={0.74} d={0.3 + k * 0.5} />
          <Corner name="lock" size={16} loop="pulse" d={k * 0.6} />
        </Node>
      ))}
      <Token cls={LS_UP[0]} on={s(1)} size={9} />
      <Token cls={LS_UP[1]} on={s(2)} size={9} />
      <Token cls={LS_FAN[0]} on={s(3)} size={9} />
      <Token cls={LS_FAN[1]} on={s(3)} size={9} />

      {/* the second question, across all three */}
      <Show on={s(4)} style={box(LS_X[0], LS.BY, LS.W - 40, LS.BH, { zIndex: 3 })}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FF 100%)', boxShadow: hot === 3 ? LIT_RING : `${RIM}, 0 10px 20px -12px rgba(31,64,140,0.5)`, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {([['server', 'Server-Side'], ['laptop', 'Client-Side']] as [Ico3DName, string][]).map(([n, l], k) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: k ? `inset 1.5px 0 0 ${colors.line}` : undefined }}>
              <Ico3D name={n} size={30} loop="bob" d={k * 0.7} />
              <span style={heading(16)}>{l}</span>
            </div>
          ))}
        </div>
      </Show>
    </Frame>
  )
}

/* ================================================================== slide 26 · C_T15 · EBS at rest */

/*
 * 546 x 330. One row (y 130): the EC2 Instance (x 72) -> the EBS Volume (x 273) -> the EBS Snapshot (x 474). Under
 * each, its blocks (y 214): the instance works with plain blocks, the volume stores ciphertext (blocks written to it
 * turn shaded one after another), the snapshot gets the same shading at press 2. Press 1 the `Encrypted` flag is set on
 * the volume; press 3 the instance-volume wire carries a padlocked packet.
 */
const EB = { W: 546, H: 330, R: 138, IX: 72, VX: 273, SX: 474, IS: 60, VS: 72, BY: 218, BS: 22, BG: 6, SB: 18 }
const EB_IN: Pt[] = [[EB.IX + EB.IS / 2, EB.R], [EB.VX - EB.VS / 2, EB.R]]
const EB_OUT: Pt[] = [[EB.VX + EB.VS / 2, EB.R], [EB.SX - EB.IS / 2, EB.R]]
const EB_DT = 0.9 // one block written per write token; the strip turns in 8 writes, holds one beat, and starts again
const EB_P = 9 * EB_DT
const EB_W = K.ride('ebw', EB_IN, 0.1, 0.75, EB_DT)
const EB_S = K.ride('ebs', EB_OUT, 0.3, 1.3, 2.4)
const vStrip = 8 * EB.BS + 7 * EB.BG
const sStrip = 3 * EB.SB + 2 * 5

/** a square plain block riding the write wire */
function BlockTok({ cls, on }: { cls: string; on: boolean }) {
  const held = useHeld()
  if (held || !on) return null
  return (
    <span aria-hidden style={{ position: 'absolute', left: -7, top: -7, width: 14, height: 14, zIndex: 6, pointerEvents: 'none' }}>
      <span className={cls} style={{ display: 'block', width: 14, height: 14, borderRadius: 4, background: '#FFFFFF', boxShadow: `inset 0 0 0 2px ${BLUE}, 0 4px 8px -4px rgba(31,64,140,0.7)`, opacity: 0 }} />
    </span>
  )
}

const C_T15: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(3, step, 1800)
  const s = (n: number) => held || step >= n
  const run = !held
  return (
    <Frame w={EB.W} h={EB.H}>
      <Wire pts={EB_IN} lit={hot === 2} />
      <Wire pts={EB_OUT} lit={hot === 1} />

      <Node x={EB.IX} y={EB.R} size={EB.IS} label="Instance"><MarkTile src={ec2Inst} size={EB.IS} lit={hot === 2} /></Node>
      <Node x={EB.VX} y={EB.R} size={EB.VS} label="Volume">
        <MarkTile src={ebsVol} size={EB.VS} lit={hot === 0} />
        <Corner name="flag" size={24} top on={s(1)} loop="swing" />
      </Node>
      <Show on={s(1)} style={{ position: 'absolute', left: EB.VX - 60, width: 120, top: EB.R - EB.VS / 2 - 34, zIndex: 3, ...tag(13.5) }}>Encrypted</Show>
      <Node x={EB.SX} y={EB.R} size={EB.IS} label="Snapshot">
        <MarkTile src={ebsSnap} size={EB.IS} lit={hot === 1} />
        <Corner name="lock" size={20} on={s(2)} loop="beat" />
      </Node>

      {/* the blocks: plain where the instance reads them, ciphertext on the volume and in its snapshot */}
      <Blocks x={EB.IX - sStrip / 2} y={EB.BY} n={3} size={EB.SB} gap={5} cipher={false} />
      <span style={{ position: 'absolute', left: EB.IX - 60, width: 120, top: EB.BY + EB.BS + 6, zIndex: 3, ...tag(13.5) }}>Plaintext</span>
      <Blocks x={EB.VX - vStrip / 2} y={EB.BY - 2} n={8} size={EB.BS} gap={EB.BG} cipher run={run} />
      <span style={{ position: 'absolute', left: EB.VX - 60, width: 120, top: EB.BY + EB.BS + 6, zIndex: 3, ...tag(13.5) }}>Ciphertext</span>
      <Blocks x={EB.SX - sStrip / 2} y={EB.BY} n={3} size={EB.SB} gap={5} cipher on={s(2)} />
      <Show on={s(2)} style={{ position: 'absolute', left: EB.SX - 60, width: 120, top: EB.BY + EB.BS + 6, zIndex: 3, ...tag(13.5) }}>Ciphertext</Show>

      {step >= 3 || held ? <IconTok cls={EB_W} name="lock" size={26} /> : <BlockTok cls={EB_W} on />}
      <Token cls={EB_S} on size={9} />
    </Frame>
  )
}

/* ================================================================== slides 27 / 30 · the encrypted-copy paths */

/*
 * 566 x 380. A path row (y 68) of tiles joined by straight wires, then the drawn console panel (x 20..546, y 150..360).
 * Press 1 the path, press 2 the panel with its checkbox ticking. A padlock token runs the path after the copy step.
 */
type PathNode = { label: string; node: (lit: boolean) => ReactNode }
const PA = { W: 566, H: 380, Y: 68, PY: 136, PH: 224 }
function pathLayout(name: string, xs: number[], size: number, period: number) {
  const seg: Pt[][] = xs.slice(1).map((x, i) => [[xs[i] + size / 2, PA.Y], [x - size / 2, PA.Y]])
  const dt = period / seg.length
  const rides = seg.map((pts, i) => K.ride(`${name}${i}`, pts, i * dt + 0.05, i * dt + dt * 0.8, period))
  return { seg, rides }
}

function CopyPath({ xs, size, nodes, lockFrom, L, s1, hot }: { xs: number[]; size: number; nodes: PathNode[]; lockFrom: number; L: ReturnType<typeof pathLayout>; s1: boolean; hot: number }) {
  return (
    <>
      {L.seg.map((pts, i) => <Wire key={i} pts={pts} on={s1} delay={i * 160} lit={hot === 0} head={9} />)}
      {nodes.map((n, i) => (
        <Node key={i} x={xs[i]} y={PA.Y} size={size} label={n.label} w={110} on={i === 0 || s1} delay={i * 140}>{n.node(hot === 0)}</Node>
      ))}
      {L.rides.map((c, i) => (i >= lockFrom ? <IconTok key={i} cls={c} name="lock" on={s1} size={24} /> : <Token key={i} cls={c} on={s1} size={9} />))}
    </>
  )
}

const VP_X = [76, 214, 352, 490]
const VP_S = 56
const VP_L = pathLayout('vp', VP_X, VP_S, 4.4)

const C_T15B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2200)
  const s = (n: number) => held || step >= n
  const nodes: PathNode[] = [
    { label: 'Unencrypted', node: (lit) => (<><MarkTile src={ebsVol} size={VP_S} lit={lit} /><Corner name="unlock" size={20} loop="tilt" /></>) },
    { label: 'Snapshot', node: (lit) => <MarkTile src={ebsSnap} size={VP_S} lit={lit} /> },
    { label: 'Copy', node: (lit) => (<><MarkTile src={ebsSnap} size={VP_S} lit={lit} /><Corner name="lock" size={20} loop="beat" /></>) },
    { label: 'Encrypted', node: (lit) => (<><MarkTile src={ebsVol} size={VP_S} lit={lit} /><Corner name="lock" size={20} loop="beat" d={0.6} /></>) },
  ]
  return (
    <Frame w={PA.W} h={PA.H}>
      <CopyPath xs={VP_X} size={VP_S} nodes={nodes} lockFrom={2} L={VP_L} s1={s(1)} hot={hot} />
      <Console x={20} y={PA.PY} w={PA.W - 40} h={PA.PH} mark={ebsMark} title="Create Volume" label="Encrypt" on={s(2)} lit={hot === 1} run={s(2) && !held} />
    </Frame>
  )
}

const DP_X = [70, 177, 284, 391, 498]
const DP_S = 52
const DP_L = pathLayout('dp', DP_X, DP_S, 5.2)

const C_T17B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2200)
  const s = (n: number) => held || step >= n
  const nodes: PathNode[] = [
    { label: 'Unencrypted', node: (lit) => (<><MarkTile src={rdsInst} size={DP_S} lit={lit} /><Corner name="unlock" size={19} loop="tilt" /></>) },
    { label: 'Snapshot', node: (lit) => <Tile name="snapshot" size={DP_S} lit={lit} d={0.3} /> },
    { label: 'Copy', node: (lit) => (<><Tile name="snapshot" size={DP_S} lit={lit} d={0.7} /><Corner name="lock" size={19} loop="beat" /></>) },
    { label: 'Restore', node: (lit) => <Tile name="refresh" size={DP_S} lit={lit} loop="spin" /> },
    { label: 'Encrypted', node: (lit) => (<><MarkTile src={rdsInst} size={DP_S} lit={lit} /><Corner name="lock" size={19} loop="beat" d={0.6} /></>) },
  ]
  return (
    <Frame w={PA.W} h={PA.H}>
      <CopyPath xs={DP_X} size={DP_S} nodes={nodes} lockFrom={2} L={DP_L} s1={s(1)} hot={hot} />
      <Console x={20} y={PA.PY} w={PA.W - 40} h={PA.PH} mark={rdsMark} title="Create Database" label="Encryption" on={s(2)} lit={hot === 1} run={s(2) && !held} />
    </Frame>
  )
}

/* ================================================================== slide 28 · C_T16 · S3 default options */

/*
 * 546 x 330. Upload (x 50) -> into the S3 Bucket frame (x 96..356, y 20..310), where the file lands as a padlock
 * (x 226, y 136, `Ciphertext` above it). The keys row (y 240): SSE-S3 (x 156), the Default switch (x 226), SSE-KMS
 * (x 296), each wired up into the padlock. SSE-KMS -> CloudTrail (x 414) -> Log (x 486), a token per use. The
 * Properties tab (x 374..526, y 20..186) at press 4.
 */
const S3 = { W: 546, H: 330, UX: 50, US: 48, FX: 96, FW: 260, FY: 20, FH: 290, LX: 226, LY: 136, LS: 60, KY: 240, KS: 46, SX: 156, KX: 296, BUS: 196, TX: 414, TS: 48, GX: 486, GS: 38, PX: 374, PY: 20, PW: 152, PH: 170 }
const S3_LB = S3.LY + S3.LS / 2
const S3_KT = S3.KY - S3.KS / 2
const S3_UP: Pt[] = [[S3.UX + S3.US / 2, S3.LY], [S3.LX - S3.LS / 2, S3.LY]]
const S3_SK: Pt[] = [[S3.SX, S3_KT], [S3.SX, S3.BUS], [S3.LX - 10, S3.BUS], [S3.LX - 10, S3_LB]]
const S3_KK: Pt[] = [[S3.KX, S3_KT], [S3.KX, S3.BUS], [S3.LX + 10, S3.BUS], [S3.LX + 10, S3_LB]]
const S3_CT: Pt[] = [[S3.KX + S3.KS / 2, S3.KY], [S3.TX - S3.TS / 2, S3.KY]]
const S3_LG: Pt[] = [[S3.TX + S3.TS / 2, S3.KY], [S3.GX - S3.GS / 2, S3.KY]]
const S3_T = 3
const S3_R = {
  up: K.ride('s3u', S3_UP, 0.05, 0.95, S3_T),
  sk: K.ride('s3s', S3_SK, 0.95, 1.6, S3_T),
  kk: K.ride('s3k', S3_KK, 0.95, 1.6, S3_T),
  ct: K.ride('s3c', S3_CT, 1.6, 2.25, S3_T),
  lg: K.ride('s3g', S3_LG, 2.25, 2.7, S3_T),
}

/** the default switch: the knob sits toward SSE-S3, then slides toward SSE-KMS */
function Switch({ x, y, right, lit }: { x: number; y: number; right: boolean; lit: boolean }) {
  const instant = useInstant()
  const W = 52
  const H = 28
  return (
    <span style={box(x - W / 2, y - H / 2, W, H, { borderRadius: 99, background: 'linear-gradient(180deg, #DCE4F4 0%, #C8D1DF 100%)', boxShadow: lit ? LIT_RING : 'inset 0 2px 4px rgba(31,64,140,0.25)', transition: instant ? 'none' : `box-shadow 420ms ${EASE}`, zIndex: 3 })}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: 99, background: `linear-gradient(180deg, #5A86FF 0%, ${BLUE} 100%)`, opacity: right ? 1 : 0, transition: instant ? 'none' : `opacity 520ms ${EASE} 500ms` }} />
      <span style={{ position: 'absolute', top: 3, left: 3, width: H - 6, height: H - 6, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 3px 6px -2px rgba(31,64,140,0.6)', transform: `translateX(${right ? W - H : 0}px)`, transition: instant ? 'none' : `transform 620ms ${EASE} 500ms` }} />
    </span>
  )
}

const C_T16: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const instant = useInstant()
  const hot = useHot(4, step, 1700)
  const s = (n: number) => held || step >= n
  const run = !held
  const kmsDefault = s(3)
  return (
    <Frame w={S3.W} h={S3.H}>
      {/* the bucket */}
      <Panel x={S3.FX} y={S3.FY} w={S3.FW} h={S3.FH} />
      <div style={box(S3.FX + 20, S3.FY + 20, 140, 32, { zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 })}>
        <MarkTile src={s3Bucket} size={32} scale={0.72} />
        <span style={heading(16)}>Bucket</span>
      </div>

      <Above>
        <Wire pts={S3_UP} />
        <div style={{ opacity: kmsDefault ? 0.3 : 1, transition: instant ? 'none' : `opacity 520ms ${EASE} 500ms` }}><Wire pts={S3_SK} on={s(1)} lit={hot === 0} /></div>
        <Wire pts={S3_KK} on={s(2)} lit={hot === 1 || hot === 2} />
        <Wire pts={S3_CT} on={s(2)} lit={hot === 1} delay={300} />
        <Wire pts={S3_LG} on={s(2)} lit={hot === 1} delay={500} head={8} />
      </Above>

      <Node x={S3.UX} y={S3.LY} size={S3.US} label="Upload" w={80}><Tile name="upload" size={S3.US} loop="float" /></Node>
      {/* the uploaded file lands and locks */}
      <Node x={S3.LX} y={S3.LY} size={S3.LS} label="Ciphertext" up gap={8}>
        <Plinth size={S3.LS}>
          <span style={{ position: 'relative', width: 42, height: 42 }}>
            <span className={lc(run, 'fdoc')} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0, ...cv(S3_T) }}><Ico3D name="doc" size={40} loop="none" /></span>
            <span className={lc(run, 'flock')} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...cv(S3_T) }}><Ico3D name="lock" size={42} loop="none" /></span>
          </span>
        </Plinth>
      </Node>

      {/* the two keys and the default between them */}
      <Node x={S3.SX} y={S3.KY} size={S3.KS} label="SSE-S3" w={80} on={s(1)}><Tile name="key" size={S3.KS} lit={hot === 0} loop="tilt" /></Node>
      <Node x={S3.KX} y={S3.KY} size={S3.KS} label="SSE-KMS" w={80} on={s(2)}><MarkTile src={kmsMark} size={S3.KS} lit={hot === 1} /></Node>
      <Show on={s(3)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <Switch x={S3.LX} y={S3.KY} right={kmsDefault} lit={hot === 2} />
        <span style={{ position: 'absolute', left: S3.LX - 40, width: 80, top: S3.KY + S3.KS / 2 + 5, ...tag(13.5) }}>Default</span>
      </Show>

      {/* each use of the KMS key is written to CloudTrail */}
      <Node x={S3.TX} y={S3.KY} size={S3.TS} label="CloudTrail" w={90} on={s(2)}><MarkTile src={trailMark} size={S3.TS} lit={hot === 1} /></Node>
      <Node x={S3.GX} y={S3.KY} size={S3.GS} label="Log" w={60} on={s(2)}>
        <Plinth size={S3.GS} lit={hot === 1}>
          <span className={lc(run && s(2), 'logp')} style={{ display: 'grid', ...cv(S3_T) }}><Ico3D name="log" size={28} loop="none" /></span>
        </Plinth>
      </Node>

      {/* the bucket's Properties tab */}
      <Show on={s(4)} style={box(S3.PX, S3.PY, S3.PW, S3.PH, { zIndex: 3 })}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', background: '#FFFFFF', boxShadow: hot === 3 ? LIT_RING : `${RIM}, 0 14px 26px -16px rgba(31,64,140,0.5)` }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '0 16px', background: 'linear-gradient(180deg, #F7F9FF 0%, #E9F0FD 100%)', boxShadow: `inset 0 -1px 0 ${colors.line}` }}>
            <span style={{ ...tag(13.5, BLUE), paddingBottom: 9, boxShadow: `inset 0 -3px 0 ${BLUE}` }}>Properties</span>
            <span style={{ paddingBottom: 15 }}><Blur w={34} h={8} /></span>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={heading(15)}>Default Encryption</span>
            <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, boxShadow: RIM, background: '#F7F9FF' }}>
              <Ico3D name="key" size={18} loop="tilt" />
              <code className="font-mono" style={{ fontSize: 13.5, fontWeight: 600, color: colors.brandDeep, fontVariantLigatures: 'none' }}>{kmsDefault ? 'SSE-KMS' : 'SSE-S3'}</code>
            </span>
          </div>
        </div>
      </Show>

      <IconTok cls={S3_R.up} name="doc" size={26} />
      {s(1) && !kmsDefault && <IconTok cls={S3_R.sk} name="key" size={24} />}
      {s(2) && kmsDefault && <IconTok cls={S3_R.kk} name="key" size={24} />}
      {s(2) && !kmsDefault && <Token cls={S3_R.kk} size={9} />}
      <Token cls={S3_R.ct} on={s(2)} size={9} />
      <Token cls={S3_R.lg} on={s(2)} size={9} />
    </Frame>
  )
}

/* ================================================================== slide 29 · C_T17 · RDS at creation */

/*
 * 546 x 330. Region 1 (x 20..338): RDS (x 88, y 172) with the padlock on its storage, a junction (x 168) fanning to
 * Backup (y 96), Snapshot (y 172), Replica (y 248) at x 262, each locked. Region 2 (x 356..526, press 2): the
 * cross-Region Replica (x 441, y 150), wired from the first replica through the gap (x 347), and its own KMS key
 * (y 240) wired round its right side (x 492) into the replica.
 */
const RD = { W: 546, H: 330, R1X: 20, R1W: 318, R2X: 356, R2W: 170, Y: 20, RH: 290, DX: 88, DY: 172, DS: 72, J: 168, TX: 262, TS: 46, GAP: 347, X2: 441, Y2: 150, S2: 50, KY: 240, KS: 46, KR: 492 }
const RD_TY = [96, 172, 248]
const RD_FAN: Pt[][] = RD_TY.map((y) => (y === RD.DY ? [[RD.J, y], [RD.TX - RD.TS / 2, y]] : [[RD.J, RD.DY], [RD.J, y], [RD.TX - RD.TS / 2, y]]))
const RD_CROSS: Pt[] = [[RD.TX + RD.TS / 2, RD_TY[2]], [RD.GAP, RD_TY[2]], [RD.GAP, RD.Y2], [RD.X2 - RD.S2 / 2, RD.Y2]]
const RD_KEY: Pt[] = [[RD.X2 + RD.KS / 2, RD.KY], [RD.KR, RD.KY], [RD.KR, RD.Y2], [RD.X2 + RD.S2 / 2, RD.Y2]]
const RD_RIDE = RD_FAN.map((pts, k) => K.ride(`rd${k}`, [[RD.DX + RD.DS / 2, RD.DY], ...pts], 0.1 + k * 0.25, 1.1 + k * 0.25, 2.8))
const RD_X = K.ride('rdx', RD_CROSS, 0.6, 1.8, 2.8)
const RD_K = K.ride('rdk', RD_KEY, 1.4, 2.4, 2.8)

function RegionHead({ x, y }: { x: number; y: number }) {
  return (
    <div style={box(x, y, 120, 30, { zIndex: 3, display: 'flex', alignItems: 'center', gap: 8 })}>
      <Ico3D name="globe" size={28} loop="float" />
      <span style={heading(15)}>Region</span>
    </div>
  )
}

const C_T17: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2200)
  const s = (n: number) => held || step >= n
  const targets: [Ico3DName, string][] = [['database', 'Backup'], ['snapshot', 'Snapshot'], ['replica', 'Replica']]
  return (
    <Frame w={RD.W} h={RD.H}>
      <Panel x={RD.R1X} y={RD.Y} w={RD.R1W} h={RD.RH} on={s(2)} />
      <Panel x={RD.R2X} y={RD.Y} w={RD.R2W} h={RD.RH} on={s(2)} lit={hot === 1} />
      <Show on={s(2)} style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <RegionHead x={RD.R1X + 20} y={RD.Y + 20} />
        <RegionHead x={RD.R2X + 20} y={RD.Y + 20} />
      </Show>

      <Above>
        <Wire pts={[[RD.DX + RD.DS / 2, RD.DY], [RD.J, RD.DY]]} on={s(1)} head={0} lit={hot === 0} />
        {RD_FAN.map((pts, k) => <Wire key={k} pts={pts} on={s(1)} lit={hot === 0} delay={150 + k * 100} />)}
        <Wire pts={RD_CROSS} on={s(2)} lit={hot === 1} />
        <Wire pts={RD_KEY} on={s(2)} lit={hot === 1} delay={250} />
      </Above>
      <Junction x={RD.J} y={RD.DY} on={s(1)} lit={hot === 0} />

      <Node x={RD.DX} y={RD.DY} size={RD.DS} label="RDS" w={90}>
        <MarkTile src={rdsMark} size={RD.DS} lit={hot === 0} />
        <Corner name="lock" size={24} loop="beat" />
      </Node>
      {targets.map(([n, l], k) => (
        <Node key={l} x={RD.TX} y={RD_TY[k]} size={RD.TS} label={l} w={90} on={s(1)} delay={150 + k * 120}>
          <Tile name={n} size={RD.TS} lit={hot === 0} d={k * 0.4} />
          <Corner name="lock" size={18} loop="beat" d={k * 0.5} />
        </Node>
      ))}

      <Node x={RD.X2} y={RD.Y2} size={RD.S2} label="Replica" w={90} on={s(2)} delay={200}>
        <Tile name="replica" size={RD.S2} lit={hot === 1} d={0.6} />
        <Corner name="lock" size={18} loop="beat" d={0.3} />
      </Node>
      <Node x={RD.X2} y={RD.KY} size={RD.KS} label="KMS Key" w={90} on={s(2)} delay={300}><MarkTile src={kmsMark} size={RD.KS} lit={hot === 1} /></Node>

      {RD_RIDE.map((c, k) => <IconTok key={k} cls={c} name="lock" on={s(1)} size={22} />)}
      <IconTok cls={RD_X} name="lock" on={s(2)} size={22} />
      <IconTok cls={RD_K} name="key" on={s(2)} size={22} />
    </Frame>
  )
}

/* ================================================================== slide 32 · C_T18B · where the work happens */

/*
 * 1080 x 420, two mirrored halves. Server-Side: the Application (x 76) uploads plaintext into the Storage Service frame
 * (x 150..510), which runs Plaintext (214) -> Data Key (330) -> Ciphertext (446) itself. Client-Side: the Application
 * frame (x 570..930) runs the same three (634, 750, 866), then uploads the ciphertext to the Storage Service (x 1004);
 * the data key never leaves the application frame. Tags above the frames. Press 1 the left flow, press 2 the right.
 */
const WH = { W: 1080, H: 420, TY: 91, FY: 131, FH: 198, LF: 150, RF: 570, FW: 360, ROW: 251, S: 72, LA: 76, RS: 1004, DX: [66, 180, 294], T: 4.8 }
const WH_HY = WH.FY + 20
const flowPts = (fx: number): Pt[][] => [
  [[fx + WH.DX[0] + WH.S / 2, WH.ROW], [fx + WH.DX[1] - WH.S / 2, WH.ROW]],
  [[fx + WH.DX[1] + WH.S / 2, WH.ROW], [fx + WH.DX[2] - WH.S / 2, WH.ROW]],
]
const WH_LIN: Pt[] = [[WH.LA + WH.S / 2, WH.ROW], [WH.LF + WH.DX[0] - WH.S / 2, WH.ROW]]
const WH_ROUT: Pt[] = [[WH.RF + WH.DX[2] + WH.S / 2, WH.ROW], [WH.RS - WH.S / 2, WH.ROW]]
const WH_L = flowPts(WH.LF)
const WH_R = flowPts(WH.RF)
const WH_RIDE = {
  l0: K.ride('whl0', WH_LIN, 0.1, 1.0, WH.T),
  l1: K.ride('whl1', WH_L[0], 1.2, 1.8, WH.T),
  l2: K.ride('whl2', WH_L[1], 2.1, 2.7, WH.T),
  r1: K.ride('whr1', WH_R[0], 0.1 + 1.1, 1.8, WH.T),
  r2: K.ride('whr2', WH_R[1], 2.1, 2.7, WH.T),
  r3: K.ride('whr3', WH_ROUT, 2.9, 3.8, WH.T),
}

function Flow({ fx, on, lit }: { fx: number; on: boolean; lit: boolean }) {
  const pts = flowPts(fx)
  return (
    <>
      <Above>{pts.map((p, i) => <Wire key={i} pts={p} on={on} lit={lit} delay={200 + i * 200} />)}</Above>
      <Node x={fx + WH.DX[0]} y={WH.ROW} size={WH.S} label="Plaintext" on={on}><Tile name="doc" size={WH.S} lit={lit} d={0.2} /></Node>
      <Node x={fx + WH.DX[1]} y={WH.ROW} size={WH.S} label="Data Key" on={on} delay={200}>
        <MarkTile src={dekMark} size={WH.S} lit={lit} />
        <Corner name="gear" size={22} loop="spin" />
      </Node>
      <Node x={fx + WH.DX[2]} y={WH.ROW} size={WH.S} label="Ciphertext" on={on} delay={400}><MarkTile src={encMark} size={WH.S} lit={lit} /></Node>
    </>
  )
}

const C_T18B: Fig = (p) => {
  const step = stepOf(p)
  const held = useHeld()
  const hot = useHot(2, step, 2600)
  const s = (n: number) => held || step >= n
  /* the whole drawing scales down as one when the slide gives it a smaller box (the lead sentence sits above it) */
  const k = Math.min(1, (Number(p.w) || WH.W) / WH.W, (Number(p.h) || WH.H) / WH.H)
  return (
    <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ width: WH.W * k, height: WH.H * k }}>
    <div style={{ width: WH.W, height: WH.H, transform: k < 1 ? `scale(${k})` : undefined, transformOrigin: '0 0' }}>
    <Frame w={WH.W} h={WH.H}>
      {/* the two tags and the two frames */}
      {[['Server-Side', WH.LF], ['Client-Side', WH.RF]].map(([l, x]) => (
        <span key={l as string} style={{ position: 'absolute', left: (x as number), width: WH.FW, top: WH.TY, zIndex: 3, ...heading(19, colors.brandDeep), textAlign: 'center' }}>{l}</span>
      ))}
      <Panel x={WH.LF} y={WH.FY} w={WH.FW} h={WH.FH} lit={hot === 0} />
      <Panel x={WH.RF} y={WH.FY} w={WH.FW} h={WH.FH} lit={hot === 1} />
      <div style={box(WH.LF + 20, WH_HY, 220, 36, { zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 })}>
        <MarkTile src={s3Mark} size={36} scale={0.7} />
        <span style={heading(16)}>Storage Service</span>
      </div>
      <div style={box(WH.RF + 20, WH_HY, 220, 36, { zIndex: 3, display: 'flex', alignItems: 'center', gap: 10 })}>
        <Plinth size={36}><Ico3D name="laptop" size={28} loop="bob" /></Plinth>
        <span style={heading(16)}>Application</span>
      </div>

      {/* server-side: the application uploads plaintext, the service encrypts it */}
      <Above><Wire pts={WH_LIN} on={s(1)} lit={hot === 0} /></Above>
      <Node x={WH.LA} y={WH.ROW} size={WH.S} label="Application" w={110} on={s(1)}><Tile name="laptop" size={WH.S} lit={hot === 0} /></Node>
      <Flow fx={WH.LF} on={s(1)} lit={hot === 0} />

      {/* client-side: the application encrypts, then uploads only the ciphertext */}
      <Flow fx={WH.RF} on={s(2)} lit={hot === 1} />
      <Above><Wire pts={WH_ROUT} on={s(2)} lit={hot === 1} delay={600} /></Above>
      <Node x={WH.RS} y={WH.ROW} size={WH.S} label="Storage Service" w={130} on={s(2)} delay={600}><MarkTile src={s3Mark} size={WH.S} lit={hot === 1} /></Node>

      <IconTok cls={WH_RIDE.l0} name="doc" on={s(1)} />
      <IconTok cls={WH_RIDE.l1} name="doc" on={s(1)} />
      <IconTok cls={WH_RIDE.l2} name="lock" on={s(1)} />
      <IconTok cls={WH_RIDE.r1} name="doc" on={s(2)} />
      <IconTok cls={WH_RIDE.r2} name="lock" on={s(2)} />
      <IconTok cls={WH_RIDE.r3} name="lock" on={s(2)} />
    </Frame>
    </div>
    </div>
    </div>
  )
}

export const figures: Record<string, Fig> = { C_T14, C_T15, C_T15B, C_T16, C_T17, C_T17B, C_T18B }

/* loop keyframes (transform / opacity only) */
const pc = (t: number, per: number) => `${((t / per) * 100).toFixed(2)}%`
export const css = `
.t15c-l { animation-delay: var(--t15c-d, 0s); }
@keyframes t15c-unl { 0%, 18% { opacity: 1 } 22%, 100% { opacity: 0 } }
.t15c-unl { animation: t15c-unl var(--t15c-t, 4.5s) linear infinite; }
@keyframes t15c-shut { 0%, 18% { opacity: 0; transform: translateY(-2px) scale(0.9) } 22% { opacity: 1; transform: translateY(0) scale(1.22) } 30%, 100% { opacity: 1; transform: translateY(0) scale(1) } }
.t15c-shut { animation: t15c-shut var(--t15c-t, 4.5s) cubic-bezier(0.45,0,0.55,1) infinite; }
${Array.from({ length: 8 }, (_, k) => {
  const t = 0.8 + k * EB_DT
  return `@keyframes t15c-ck${k} { 0%, ${pc(t, EB_P)} { opacity: 0; transform: scale(0.6) } ${pc(t + 0.14, EB_P)} { opacity: 1; transform: scale(1.1) } ${pc(t + 0.28, EB_P)}, 100% { opacity: 1; transform: scale(1) } }
.t15c-ck${k} { animation: t15c-ck${k} ${EB_P}s linear infinite; }`
}).join('\n')}
@keyframes t15c-tick { 0%, 14% { opacity: 0; transform: scale(0.4) } 24% { opacity: 1; transform: scale(1.18) } 32%, 100% { opacity: 1; transform: scale(1) } }
.t15c-tick { animation: t15c-tick var(--t15c-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes t15c-fdoc { 0%, ${pc(0.85, S3_T)} { opacity: 0; transform: scale(0.7) } ${pc(1.0, S3_T)} { opacity: 1; transform: scale(1) } ${pc(1.5, S3_T)} { opacity: 1; transform: scale(1) } ${pc(1.65, S3_T)}, 100% { opacity: 0; transform: scale(0.8) } }
.t15c-fdoc { animation: t15c-fdoc var(--t15c-t, 3s) linear infinite; }
@keyframes t15c-flock { 0%, ${pc(0.85, S3_T)} { opacity: 1; transform: scale(1) } ${pc(0.95, S3_T)} { opacity: 0; transform: scale(0.8) } ${pc(1.55, S3_T)} { opacity: 0; transform: scale(0.8) } ${pc(1.7, S3_T)} { opacity: 1; transform: scale(1.18) } ${pc(1.85, S3_T)}, 100% { opacity: 1; transform: scale(1) } }
.t15c-flock { animation: t15c-flock var(--t15c-t, 3s) linear infinite; }
@keyframes t15c-logp { 0%, ${pc(2.65, S3_T)} { transform: translateY(0) scale(1) } ${pc(2.78, S3_T)} { transform: translateY(-3px) scale(1.14) } ${pc(2.95, S3_T)}, 100% { transform: translateY(0) scale(1) } }
.t15c-logp { animation: t15c-logp var(--t15c-t, 3s) linear infinite; }
${K.css()}
.cc-still .t15c-l, .deck-thumb .t15c-l { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .t15c-l { animation: none !important; } }
`
