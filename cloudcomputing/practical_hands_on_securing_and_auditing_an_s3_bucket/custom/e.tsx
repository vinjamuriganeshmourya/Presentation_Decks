import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Ico3D, type Ico3DName, type Loop, type Badge } from '@/engine/icons3d'
import { Frame, Plinth, MarkTile, Panel, Wire, Show, useHot, useHeld, keyframes, Token, tag, heading, EASE, ORANGE, PAD, FONT, type Pt } from '@/engine/figkit'
import ctMark from '../images/aws-cloudtrail.svg'
import bucketMark from '../images/res-s3-bucket.svg'

/*
 * SESSION 17 · PRACTICAL (Securing and Auditing an S3 Bucket) · builder C (file e)
 * E_P22 (slide 50): the seven TR steps as a snake of white step cards; E_P27C (slide 63): the cleanup order.
 * Standing correction 17 and correction 8 (a long lab step list gets an engaging layout): 3D icons on plinths, PAD 20
 * inside every card, orthogonal wires from the box constants, flow dots after the build, the lit card walking, held
 * frames complete with nothing lit. No number badges (R10): the order is the wire. Class prefix `t17e-`.
 */

type Fig = (p: Record<string, unknown>) => ReactNode
const K = keyframes('t17e')
const MONO = "'JetBrains Mono', ui-monospace, monospace"

/* ================================================================== 50 · E_P22 · what the practical builds */

/*
 * 1100 x 344. Row 1 left to right: steps 1-4 (step 4, the long one, in a wider card); the track turns down from step 4
 * into row 2, which runs right to left: steps 5, 6, 7 in three equal cards. Each press brings in the next card and the
 * wire into it; after the build the lit card walks 1 -> 7 -> 1 and a dot rides each wire.
 */
const P = { W: 1100, H: 344, CH: 142, GAP: 20, TS: 52, T: 6.4 }
const P_W1 = [220, 220, 220, 340]
const P_X1 = P_W1.map((_, i) => PAD + P_W1.slice(0, i).reduce((a, b) => a + b + P.GAP, 0))
const P_W2 = (P.W - PAD * 2 - P.GAP * 2) / 3 // 340
const P_Y = [PAD, P.H - PAD - P.CH] // 20, 210
/* card boxes in TR order; row 2 runs right to left */
const P_BOX = [
  ...P_X1.map((x, i) => ({ x, y: P_Y[0], w: P_W1[i] })),
  ...[2, 1, 0].map((k) => ({ x: PAD + k * (P_W2 + P.GAP), y: P_Y[1], w: P_W2 })),
]
/* wire i leads INTO card i + 1 */
const P_WIRES: Pt[][] = P_BOX.slice(0, -1).map((a, i) => {
  const b = P_BOX[i + 1]
  if (a.y !== b.y) {
    const x = a.x + a.w / 2
    return [[x, a.y + P.CH], [x, b.y]]
  }
  const cy = a.y + P.CH / 2
  return b.x > a.x ? [[a.x + a.w, cy], [b.x, cy]] : [[a.x, cy], [b.x + b.w, cy]]
})
const P_RIDE = P_WIRES.map((pts, i) => {
  const [s, t] = pts
  const back: Pt = s[0] === t[0] ? [t[0], t[1] - 10] : [t[0] + (t[0] > s[0] ? -10 : 10), t[1]]
  return K.ride(`p22-${i}`, [s, back], 0.2 + i * 0.95, 0.75 + i * 0.95, P.T)
})
const P_ICON: { icon?: Ico3DName; mark?: string; loop: Loop; badge?: Badge }[] = [
  { icon: 'bucket', loop: 'bob', badge: 'lock' },
  { icon: 'upload', loop: 'float' },
  { icon: 'policy', loop: 'tilt', badge: 'lock' },
  { icon: 'ban', loop: 'pulse' },
  { icon: 'checklist', loop: 'bob' },
  { icon: 'scan', loop: 'float' },
  { mark: ctMark, loop: 'none' },
]

const E_P22: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const items = (p.items as string[] | undefined) ?? []
  const held = useHeld()
  const hot = useHot(7, step, 1700)
  const on = (i: number) => held || step >= i + 1
  return (
    <Frame w={P.W} h={P.H}>
      {P_WIRES.map((pts, i) => (
        <Wire key={`w${i}`} pts={pts} head={9} on={on(i + 1)} lit={hot === i + 1} delay={100} />
      ))}
      {P_RIDE.map((cls, i) => (
        <Token key={`t${i}`} cls={cls} on={step >= 7} />
      ))}
      {P_BOX.map((b, i) => {
        const ic = P_ICON[i]
        return (
          <Panel key={i} x={b.x} y={b.y} w={b.w} h={P.CH} on={on(i)} lit={hot === i} radius={18} delay={150}>
            <div style={{ position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              {ic.mark ? (
                <MarkTile src={ic.mark} size={P.TS} />
              ) : (
                <Plinth size={P.TS}><Ico3D name={ic.icon ?? 'doc'} size={38} loop={ic.loop} d={i * 0.45} badge={ic.badge} /></Plinth>
              )}
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, lineHeight: 1.36, color: colors.ink }}>{items[i] ?? ''}</span>
            </div>
          </Panel>
        )
      })}
    </Frame>
  )
}

/* ================================================================== 63 · E_P27C · cleanup order */

/*
 * 1080 x 300. Left: the object card over the bucket card (the TR's order, object first). Middle: the trash, each card's
 * wire turning into its side. Right: what stays untouched, every other bucket and CloudTrail, each with a keep tick.
 * Press 1 deletes the object, press 2 the bucket, press 3 lights what stays. Held: both cards at full strength with
 * their trash badges (Session 14's held-frame rule), the wires drawn, the ticks on, nothing lit, nothing moving.
 */
const C = { W: 1080, H: 300, LX: PAD, LW: 400, CH: 96, OY: 34, BY: 170, TX: 556, TY: 150, TS: 100, ELB: 478, KX: 676 }
const C_KW = C.W - PAD - C.KX // 384
const C_KY = 40
const C_KH = 220
const C_OC = C.OY + C.CH / 2 // 112
const C_BC = C.BY + C.CH / 2 // 248
const C_WIRE: Pt[][] = [
  [[C.LX + C.LW, C_OC], [C.ELB, C_OC], [C.ELB, C.TY - 22], [C.TX - C.TS / 2, C.TY - 22]],
  [[C.LX + C.LW, C_BC], [C.ELB, C_BC], [C.ELB, C.TY + 22], [C.TX - C.TS / 2, C.TY + 22]],
]
const C_RIDE = C_WIRE.map((pts, i) => K.ride(`c27-${i}`, [...pts.slice(0, -1), [C.TX - C.TS / 2 - 10, pts[3][1]]], 0.2 + i * 1.6, 1.4 + i * 1.6, 3.6))

function Corner({ x, y, on = true, size = 32, children }: { x: number; y: number; on?: boolean; size?: number; children: ReactNode }) {
  return (
    <Show on={on} lift={0} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 6 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>{children}</span>
    </Show>
  )
}

/** a card that lifts and fades when deleted (live only; held frames keep it whole with its trash badge) */
function Lift({ x, y, w, h, gone, lit, children }: { x: number; y: number; w: number; h: number; gone: boolean; lit: boolean; children: ReactNode }) {
  const instant = useInstant()
  const held = useHeld()
  const tr = instant ? 'none' : `transform 620ms ${EASE}, opacity 620ms ${EASE}, box-shadow 420ms ${EASE}`
  const fade = gone && !instant && !held
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 2, transform: fade ? 'translateY(-8px)' : 'none', transition: tr }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(180deg, #FFFFFF 0%, #ECF2FD 100%)', boxShadow: 'inset 0 0 0 1px #CFDCF5, 0 12px 24px -16px rgba(31,64,140,0.34)', opacity: fade ? 0.6 : 1, transition: tr }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, zIndex: 1, pointerEvents: 'none', boxShadow: lit ? `0 0 0 2.5px ${ORANGE}, 0 10px 22px -14px rgba(255,138,61,0.8)` : 'none', transition: tr }} />
      <div style={{ position: 'absolute', inset: 0, opacity: fade ? 0.55 : 1, transition: tr }}>{children}</div>
      <Corner x={w - 6} y={6} on={gone}><Ico3D name="trash" size={24} loop="beat" t={2.4} /></Corner>
    </div>
  )
}

const E_P27C: Fig = (p) => {
  const step = Number(p.step ?? 0)
  const held = useHeld()
  const hot = useHot(3, step, 2000)
  const on = (i: number) => held || step >= i + 1
  const mono = { fontFamily: MONO, fontVariantLigatures: 'none' as const, fontSize: 16, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' as const }
  return (
    <Frame w={C.W} h={C.H}>
      {/* the two deletions, in the TR's order: the object, then the bucket */}
      <Lift x={C.LX} y={C.OY} w={C.LW} h={C.CH} gone={on(0)} lit={hot === 0}>
        <div style={{ position: 'absolute', inset: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Plinth size={56}><Ico3D name="doc" size={42} loop="float" /></Plinth>
          <span style={mono}>security-demo.txt</span>
        </div>
      </Lift>
      <Lift x={C.LX} y={C.BY} w={C.LW} h={C.CH} gone={on(1)} lit={hot === 1}>
        <div style={{ position: 'absolute', inset: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <MarkTile src={bucketMark} size={56} />
          <span style={mono}>s17-security-lab-unique123</span>
        </div>
      </Lift>
      {C_WIRE.map((pts, i) => (
        <div key={i}>
          <Wire pts={pts} head={10} on={on(i)} lit={hot === i} delay={200} />
          <Token cls={C_RIDE[i]} on={on(i) && !held} />
        </div>
      ))}

      {/* the trash */}
      <div style={{ position: 'absolute', left: C.TX - C.TS / 2, top: C.TY - C.TS / 2, width: C.TS, height: C.TS, zIndex: 3 }}>
        <Plinth size={C.TS} lit={hot === 0 || hot === 1}><Ico3D name="trash" size={70} loop="beat" t={2.6} /></Plinth>
      </div>
      <div style={{ position: 'absolute', left: C.TX - 60, top: C.TY + C.TS / 2 + 10, width: 120, zIndex: 3, ...tag(16) }}>Delete</div>

      {/* what stays untouched */}
      <Panel x={C.KX} y={C_KY} w={C_KW} h={C_KH} on lit={hot === 2}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <Ico3D name="shield" size={30} loop="pulse" t={2.8} />
          <span style={heading(20)}>Untouched</span>
        </div>
        <div style={{ position: 'absolute', left: 20, right: 20, top: 84, display: 'flex', justifyContent: 'space-around' }}>
          {[
            { label: 'Other Buckets', node: (
              <Plinth size={80}>
                <span style={{ position: 'relative', display: 'grid', width: 60, height: 52 }}>
                  <span style={{ position: 'absolute', left: 0, top: 0 }}><Ico3D name="bucket" size={42} loop="bob" d={0.4} /></span>
                  <span style={{ position: 'absolute', right: 0, bottom: 0 }}><Ico3D name="bucket" size={42} loop="bob" d={1.2} /></span>
                </span>
              </Plinth>
            ) },
            { label: 'CloudTrail', node: <MarkTile src={ctMark} size={80} /> },
          ].map((t, i) => (
            <div key={t.label} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {t.node}
              <span style={tag(16)}>{t.label}</span>
              <span style={{ position: 'absolute', left: '50%', top: -10, marginLeft: 30 }}>
                <Show on={on(2)} lift={0}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 99, background: '#FFFFFF', boxShadow: '0 4px 10px -5px rgba(31,64,140,0.6), inset 0 0 0 1px #D3DEF6' }}>
                    <Ico3D name="check" size={24} loop="pulse" d={i * 0.7} t={2.4} />
                  </span>
                </Show>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </Frame>
  )
}

export const figures: Record<string, Fig> = { E_P22, E_P27C }

export const css = `
${K.css()}
`
