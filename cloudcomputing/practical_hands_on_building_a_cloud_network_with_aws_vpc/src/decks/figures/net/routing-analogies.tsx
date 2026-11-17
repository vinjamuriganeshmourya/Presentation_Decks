import type { CSSProperties, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { useAutoAnim } from '@/deck/autoAnim'
import { Arrow, At, Label, REDUCED, STILL, useLoop } from '../scene'
import { AN_W, IsoAnalogy } from '../iso/frames'
import { Boundary, Gateway, InternetCloud, MiniRouteTable, NET, NoMark, Resource, SubnetBox, within } from './frames'
import { fx, Ripple } from './fx'
import { Art3dDefs, Desk3D, Exchange3D, JunctionBox, LibFigure, Office3D, Parcel, Phone3D, Ticket, VanRear } from './routing-art'

/**
 * THE ROUTING SECTION'S THREE ANALOGIES (visual pass 2026-11-04; course R3: kicker,
 * title and the two pictures, every clause of the TR a tag inside the picture it
 * describes). The familiar side is a concrete, side-on scene drawn like Session 4's
 * BusAnalogy (`./routing-art`); the concept side is the deck's network pieces.
 *
 * ONE CLOCK PER SLIDE drives both pictures (`useLoop` with `beats`, so auto
 * animation OFF walks it one beat per press and ON loops it): each beat is one
 * pair of the analogy; the pair in focus is solid and everything else fades (G4);
 * the motion IS the explanation (a parcel scanned, then sorted down its chute;
 * a visitor going out and back through the counter while an outsider is turned
 * away; a call placed straight down the private line). With auto animation ON
 * the loop starts again right after the last pair (R8.1, `useRestless`); the
 * whole picture is the last auto-OFF press and the frame harness URLs hold.
 *
 * G4, parallel paths in distinct colours, the same on both sides of a slide:
 *   postal   green = local, blue = the default route to the gateway, violet = peering
 *   ticket   blue = going out, green = coming back, red = turned away
 *   phone    blue = the private line / the peering line, grey = the public route
 */

const AN_H = 390
const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const FADE = 0.26
const R = { local: colors.success, gw: colors.brand, peer: '#7C3AED' } as const
const opFor = (focus: number, part: number) => (focus < 0 || focus === part ? 1 : FADE)
const fadeT = `opacity 460ms ${EASE}`

function useHeld() {
  const instant = useInstant()
  return STILL || REDUCED || instant
}

/**
 * One analogy clock (R8.1, 2026-11-04: loops restart at once). Auto animation ON: the
 * phase runs 0..`end` (the end of the last pair's action) at the loop's own speed and
 * starts again immediately, so no rest beat sits between cycles. Auto OFF: the `beats`
 * are the presses, unchanged, the last one the whole picture (also the harness frame).
 */
function useRestless(periodMs: number, beats: number[], end: number) {
  const auto = useAutoAnim()
  const raw = useLoop(Math.round(periodMs * end), { mode: 'sawtooth', still: 0.98, beats })
  return auto ? raw * end : raw
}

/** A tag inside a picture, in the TR's words; solid while its pair is the one in focus. */
function Tag({ children, lit = false, style }: { children: ReactNode; lit?: boolean; style?: CSSProperties }) {
  return (
    <Label size={14} strong tone={lit ? 'solid' : 'plain'} raised style={style}>
      {children}
    </Label>
  )
}

/** A group that fades out of focus. */
function Part({ op, children }: { op: number; children: ReactNode }) {
  return <g style={{ opacity: op, transition: fadeT }}>{children}</g>
}

function DomPart({ op, children }: { op: number; children: ReactNode }) {
  return <div className="absolute inset-0" style={{ opacity: op, transition: fadeT }}>{children}</div>
}

/** A small packet chip that moves with the clock (an envelope: its header and its sealed body). */
function PacketChip({ x, y, on, tone = colors.brand }: { x: number; y: number; on: boolean; tone?: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ left: x - 13, top: y - 9, width: 26, height: 18, opacity: on ? 1 : 0, transition: 'opacity 200ms', zIndex: 4 }}>
      <svg width={26} height={18} viewBox="0 0 26 18">
        <rect x={0.5} y={0.5} width={25} height={17} rx={3} fill="#FFFFFF" stroke={tone} strokeWidth={1.5} />
        <rect x={0.5} y={0.5} width={25} height={6} rx={3} fill={tone} />
        <rect x={9} y={9.5} width={8} height={6} rx={1.4} fill="#7A879E" />
      </svg>
    </span>
  )
}

const lerp = (a: number, b: number, s: number) => a + (b - a) * s
const along = (p: [number, number], q: [number, number], s: number): [number, number] => [lerp(p[0], q[0], s), lerp(p[1], q[1], s)]

/* ============================================================== T14-AN · A postal sorting hub */

/* both pictures share the rows: the reading pair at the top, the sealed pair, the sending pair at the foot */
const PR = { top: 26, sealed: 318, send: 362 } as const
/* the hub's places (svg px in the 470 x 390 stage) */
const HUB = { wallTop: 58, floor: 282, beltY: 120, beltX: [14, 240] as const, scanX: 191, divX: 246 } as const
const VANS = [270, 345, 420] as const
const VAN_TOP = 212
const CHUTE_TONE = [R.local, R.gw, R.peer] as const
/** the default chute: where this parcel goes (it matches 0.0.0.0/0, the gateway) */
const PICK = 1
const CLOSE = { x: 104, y: 226, w: 92 }

/** The postal clock: 0 the parcel rides in and is scanned; 1 it is sorted down the default chute into its van; 2 it was never opened; then the whole hub. */
function usePostal() {
  const held = useHeld()
  const t = useRestless(9600, [0.32, 0.64, 0.94, 0.98], 0.945)
  const focus = held ? -1 : t <= 0.325 ? 0 : t <= 0.645 ? 1 : t <= 0.945 ? 2 : -1
  return { t: held ? 0.98 : t, focus, held }
}

function parcelAt(t: number): { x: number; y: number; on: boolean } {
  const y0 = HUB.beltY - 11
  if (t < 0.36) return { x: lerp(HUB.beltX[0] + 8, HUB.scanX, within(t, 0.02, 0.26)), y: y0, on: t > 0.015 }
  if (t < 0.44) return { x: lerp(HUB.scanX, HUB.divX - 6, within(t, 0.36, 0.44)), y: y0, on: true }
  const s = within(t, 0.44, 0.58)
  /* down the chute's curve: a quadratic from the belt's end to the van's open doors */
  const p0: [number, number] = [HUB.divX, HUB.beltY + 10]
  const c: [number, number] = [VANS[PICK], HUB.beltY + 10]
  const p1: [number, number] = [VANS[PICK], VAN_TOP + 14]
  const x = (1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * c[0] + s * s * p1[0]
  const y = (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * c[1] + s * s * p1[1]
  return { x, y, on: t < 0.6 }
}

function PostalFamiliar({ t, focus }: { t: number; focus: number }) {
  const p = parcelAt(t)
  const moving = !STILL && ((t > 0.02 && t < 0.26) || (t > 0.36 && t < 0.44))
  const scanning = !STILL && t > 0.22 && t < 0.37
  const sorting = t > 0.38
  const doorsOpen = (i: number) => i !== PICK || t < 0.66
  const opRead = opFor(focus, 0)
  const opSend = opFor(focus, 1)
  const opSeal = opFor(focus, 2)
  return (
    <>
      <svg className="absolute inset-0" width={AN_W} height={AN_H} viewBox={`0 0 ${AN_W} ${AN_H}`} aria-hidden>
        {/* THE HUB: a factory hall cut away, its sawtooth roof with skylights, the floor */}
        <rect x={12} y={HUB.wallTop} width={446} height={HUB.floor - HUB.wallTop} rx={4} fill="#EEF2FA" stroke="#C7D3EA" />
        <path d={`M 8 ${HUB.wallTop} ${Array.from({ length: 6 }, (_, i) => `L ${8 + i * 76 + 50} ${HUB.wallTop - 16} L ${8 + i * 76 + 76} ${HUB.wallTop}`).join(' ')}`} fill={colors.brandDark} />
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M ${8 + i * 76 + 52} ${HUB.wallTop - 13} L ${8 + i * 76 + 72} ${HUB.wallTop - 2}`} stroke="#9CC0FF" strokeWidth={2.5} />
        ))}
        {/* pendant lamps from the roof, and the hub's sign: an envelope */}
        {[300, 380].map((x) => (
          <g key={x}>
            <line x1={x} y1={HUB.wallTop} x2={x} y2={HUB.wallTop + 18} stroke="#7A879E" strokeWidth={1.4} />
            <path d={`M ${x - 9} ${HUB.wallTop + 26} Q ${x} ${HUB.wallTop + 12} ${x + 9} ${HUB.wallTop + 26} Z`} fill="#4A5B74" />
            <ellipse cx={x} cy={HUB.wallTop + 27} rx={5} ry={2} fill="#FFE29A" className={STILL ? undefined : 'rt-bulb'} />
          </g>
        ))}
        <g transform={`translate(400 ${HUB.wallTop + 40})`}>
          <rect x={0} y={0} width={44} height={30} rx={4} fill="#FFFFFF" stroke="#B3C2DF" />
          <rect x={8} y={7} width={28} height={17} rx={2} fill="#FFC531" />
          <path d="M 8 8 L 22 18 L 36 8" fill="none" stroke="#C99A1A" strokeWidth={1.6} />
        </g>
        <rect x={6} y={HUB.floor} width={458} height={9} rx={2} fill="#B9C2CF" />
        <rect x={6} y={HUB.floor + 9} width={458} height={4} fill="#9AA6B8" opacity={0.6} />

        {/* READING: the door the parcels come in by, the belt, its rollers, the scanner arch reading the label */}
        <Part op={opRead}>
          <rect x={12} y={HUB.beltY - 34} width={20} height={42} fill="#2A2D38" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={13 + i * 4.6} y={HUB.beltY - 33} width={3.4} height={38} fill="#8FA3C7" opacity={0.55} />
          ))}
          <rect x={HUB.beltX[0]} y={HUB.beltY} width={HUB.beltX[1] - HUB.beltX[0]} height={9} rx={4.5} fill="#3B4660" />
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i} className={moving ? 'rt-roll' : undefined}>
              <circle cx={22 + i * 20.5} cy={HUB.beltY + 4.5} r={3.4} fill="#C8D2E6" />
              <line x1={22 + i * 20.5 - 3} y1={HUB.beltY + 4.5} x2={22 + i * 20.5 + 3} y2={HUB.beltY + 4.5} stroke="#5B6478" strokeWidth={1} />
            </g>
          ))}
          {[30, 176, 232].map((x) => (
            <rect key={x} x={x - 2.5} y={HUB.beltY + 9} width={5} height={HUB.floor - HUB.beltY - 9} fill="#7A879E" />
          ))}
          {/* the scanner: an arch over the belt, a head, its beam on the label, a screen showing the code it read */}
          <rect x={HUB.scanX - 23} y={80} width={46} height={9} rx={2.5} fill="#4A5B74" />
          <rect x={HUB.scanX - 21} y={89} width={5} height={HUB.beltY - 89} fill="#7A879E" />
          <rect x={HUB.scanX + 16} y={89} width={5} height={HUB.beltY - 89} fill="#7A879E" />
          <rect x={HUB.scanX - 7} y={89} width={14} height={6} rx={2} fill="#25252B" />
          {scanning && <path className="rt-beam" d={`M ${HUB.scanX} 95 L ${HUB.scanX - 10} ${HUB.beltY - 14} L ${HUB.scanX + 10} ${HUB.beltY - 14} Z`} fill={colors.accent} opacity={0.75} />}
          <rect x={HUB.scanX - 18} y={64} width={36} height={14} rx={2.5} fill="#1B2433" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={HUB.scanX - 14 + i * 4.2} y={67} width={i % 3 ? 1.6 : 2.6} height={8} fill={t > 0.24 ? '#5CE1E6' : '#3B4660'} style={{ transition: 'fill 300ms' }} />
          ))}
        </Part>

        {/* SENDING: the diverter at the belt's end, three chutes, one per route colour, a van under each */}
        <Part op={opSend}>
          <circle cx={HUB.divX} cy={HUB.beltY + 5} r={5} fill="#4A5B74" />
          <rect x={HUB.divX - 2} y={HUB.beltY - 3} width={4} height={22} rx={2} fill="#4A5B74" style={{ transformOrigin: `${HUB.divX}px ${HUB.beltY + 5}px`, transform: `rotate(${sorting ? -38 : 0}deg)`, transition: `transform 380ms ${EASE}` }} />
          {VANS.map((cx, i) => {
            const d = `M ${HUB.divX} ${HUB.beltY + 10} Q ${cx} ${HUB.beltY + 10} ${cx} ${VAN_TOP + 2}`
            const on = focus !== 1 || i === PICK
            return (
              <g key={i} style={{ opacity: on ? 1 : 0.35, transition: fadeT }}>
                <path d={d} fill="none" stroke={CHUTE_TONE[i]} strokeOpacity={0.22} strokeWidth={18} strokeLinecap="round" />
                <path d={d} fill="none" stroke={CHUTE_TONE[i]} strokeWidth={2.4} strokeDasharray={i === PICK && focus === 1 ? '6 6' : undefined} className={i === PICK && focus === 1 ? 'mo mo-dash' : undefined} strokeLinecap="round" />
              </g>
            )
          })}
          {VANS.map((cx, i) => (
            <g key={i} style={{ opacity: focus !== 1 || i === PICK ? 1 : 0.4, transition: fadeT }}>
              <VanRear cx={cx} y={VAN_TOP} tone={CHUTE_TONE[i]} open={doorsOpen(i)} lit={i === PICK && focus === 1} />
            </g>
          ))}
        </Part>

        {/* SEALED: the parcel itself, close up on a pallet, taped shut, the seal on its tape */}
        <Part op={opSeal}>
          <rect x={CLOSE.x - 54} y={CLOSE.y + 36} width={108} height={8} rx={2} fill="#B07A44" />
          {[-44, -6, 32].map((dx) => (
            <rect key={dx} x={CLOSE.x + dx} y={CLOSE.y + 44} width={12} height={8} fill="#8E6237" />
          ))}
          <Parcel x={CLOSE.x} y={CLOSE.y} w={CLOSE.w} sealGlow={focus === 2} />
        </Part>

        {/* the parcel on its way */}
        {p.on && <Parcel x={p.x} y={p.y} w={26} />}
      </svg>

      {/* the seal on the close-up parcel's tape: it stays shut */}
      <div style={{ opacity: opSeal, transition: fadeT }}>
        <At x={CLOSE.x + 6} y={CLOSE.y - 30} cx cy>
          <span className={`grid h-[30px] w-[30px] place-items-center rounded-full ${focus === 2 ? fx('shackle', 0, 2.4).className : ''}`} style={{ ...(focus === 2 ? fx('shackle', 0, 2.4).style : {}), background: focus === 2 ? colors.accent : colors.brandDark, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.6)`, transition: `background 420ms ${EASE}` }}>
            <Lock size={15} strokeWidth={2.6} />
          </span>
        </At>
      </div>
      <Ripple x={HUB.scanX} y={HUB.beltY - 11} r={24} tone={colors.accent} on={focus === 0 && t > 0.22} />

      <At x={HUB.scanX} y={PR.top} cx cy>
        <Tag lit={focus === 0}>Reads Only the Pincode on a Parcel</Tag>
      </At>
      <At x={130} y={PR.sealed} cx cy>
        <Tag lit={focus === 2}>Never Opening the Parcel Itself</Tag>
      </At>
      <At x={318} y={PR.send} cx cy>
        <Tag lit={focus === 1}>Sends It to the Correct Delivery Van</Tag>
      </At>
    </>
  )
}

/* the concept: the packet card at the left, the route table, the three targets in the chutes' colours */
const PK = { x: 18, y: 128, w: 74, h: 58 }
const RT = { x: 124, y: 118, w: 206, rowH: 26 }
const RT_DEST_W = Math.round((RT.w * 1.15) / 2.15)
const TG = { cx: 410, local: 100, gw: 176, peer: 252 } as const
const JUNCTION_X = RT.x + RT.w + 4
const rtRowY = (i: number) => RT.y + RT.rowH + RT.rowH * i + RT.rowH / 2

function RouteDot({ tone }: { tone: string }) {
  return <span aria-hidden className="mr-1.5 inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: tone }} />
}

function PostalConcept({ t, focus }: { t: number; focus: number }) {
  const reads = focus === 0
  const forwards = focus === 1
  const sealed = focus === 2
  const opRead = opFor(focus, 0)
  const opSend = opFor(focus, 1)
  const opSeal = opFor(focus, 2)
  /* the packet: rides into the table while it is read, then out along the default route to the gateway */
  const inStart: [number, number] = [PK.x + PK.w + 14, PK.y + 14]
  const inEnd: [number, number] = [RT.x - 12, PK.y + 14]
  const outStart: [number, number] = [JUNCTION_X + 8, rtRowY(1)]
  const outEnd: [number, number] = [TG.cx - 30, TG.gw]
  const pos = t < 0.36 ? along(inStart, inEnd, within(t, 0.02, 0.26)) : along(outStart, outEnd, within(t, 0.4, 0.58))
  const showChip = !STILL && t > 0.015 && t < 0.62 && !(t > 0.27 && t < 0.4)
  const target = (i: 0 | 1 | 2) => (focus !== 1 || i === PICK ? 1 : 0.32)
  return (
    <>
      <At x={235} y={PR.top} cx cy>
        <Tag lit={reads}>Reads Only the Destination Address</Tag>
      </At>

      {/* THE PACKET: its header (the destination address) and its sealed body */}
      <DomPart op={focus === 1 ? FADE : 1}>
        <At x={PK.x} y={PK.y}>
          <svg width={PK.w} height={PK.h} viewBox={`0 0 ${PK.w} ${PK.h}`} aria-hidden>
            <rect x={1} y={1} width={PK.w - 2} height={PK.h - 2} rx={8} fill="#FFFFFF" stroke={colors.brand} strokeWidth={2} />
            <rect x={1} y={1} width={PK.w - 2} height={20} rx={8} fill={reads ? colors.accent : colors.brand} style={{ transition: `fill 420ms ${EASE}` }} />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={10 + i * 14} y={8} width={10} height={6} rx={2} fill="#FFFFFF" opacity={0.85} />
            ))}
            <rect x={10} y={30} width={PK.w - 20} height={5} rx={2.5} fill="#D7DEEA" />
            <rect x={10} y={40} width={PK.w - 36} height={5} rx={2.5} fill="#D7DEEA" />
          </svg>
        </At>
        <At x={PK.x + PK.w / 2} y={PK.y + PK.h + 20} cx cy>
          <Tag>Packet</Tag>
        </At>
      </DomPart>
      {/* the seal on its body: nothing inside is touched */}
      <At x={PK.x + PK.w - 12} y={PK.y + PK.h - 10} cx cy style={{ opacity: opSeal, transition: fadeT, zIndex: 5 }}>
        <span className={`grid h-[26px] w-[26px] place-items-center rounded-full ${sealed ? fx('shackle', 0, 2.4).className : ''}`} style={{ ...(sealed ? fx('shackle', 0, 2.4).style : {}), background: sealed ? colors.accent : colors.brandDark, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}` }}>
          <Lock size={13} strokeWidth={2.6} />
        </span>
      </At>

      {/* THE ROUTE TABLE: only the Destination column is read */}
      <DomPart op={opRead === 1 || forwards ? 1 : FADE}>
        <Arrow x1={inStart[0] - 12} y1={inStart[1]} x2={RT.x - 4} y2={inStart[1]} tone={reads ? colors.accent : colors.muted} />
        <At x={RT.x} y={RT.y}>
          <MiniRouteTable
            w={RT.w}
            size={13}
            rows={[
              ['10.0.0.0/16', <span key="l" className="whitespace-nowrap"><RouteDot tone={R.local} />local</span>],
              ['0.0.0.0/0', <span key="g" className="whitespace-nowrap"><RouteDot tone={R.gw} />igw-id</span>],
            ]}
            litRow={forwards ? 1 : -1}
          />
        </At>
        {/* the column the router reads, ringed while it reads, a scan line running down it */}
        <span aria-hidden className="pointer-events-none absolute rounded-[10px]" style={{ left: RT.x - 3, top: RT.y - 3, width: RT_DEST_W + 6, height: RT.rowH * 3 + 8, boxShadow: `inset 0 0 0 2.5px ${colors.accent}`, opacity: reads ? 1 : 0, transition: fadeT }} />
        {reads && !STILL && <span aria-hidden className="rt-scan pointer-events-none absolute" style={{ left: RT.x + 4, top: RT.y + 2, width: RT_DEST_W - 8, height: 3, borderRadius: 2, background: colors.accent }} />}
      </DomPart>

      {/* THE TARGETS, one route colour each: local, the gateway (the default route), a peering link */}
      <DomPart op={opSend}>
        <div style={{ opacity: target(0), transition: fadeT }}>
          <Arrow x1={JUNCTION_X} y1={rtRowY(0)} x2={TG.cx - 50} y2={TG.local + 6} tone={R.local} />
          <At x={TG.cx - 46} y={TG.local - 26}>
            <SubnetBox w={92} h={56} kind="public" label="Local">
              <At x={70} y={34} cx cy>
                <Resource size={26} />
              </At>
            </SubnetBox>
          </At>
        </div>
        <div style={{ opacity: target(1), transition: fadeT }}>
          <Arrow x1={JUNCTION_X} y1={rtRowY(1)} x2={TG.cx - 24} y2={TG.gw} tone={R.gw} width={forwards ? 3.5 : 2.5} />
          <At x={TG.cx} y={TG.gw + 14} cx cy>
            <Gateway kind="igw" size={40} label="Gateway" lit={forwards} />
          </At>
        </div>
        <div style={{ opacity: target(2), transition: fadeT }}>
          <Arrow x1={JUNCTION_X} y1={rtRowY(1) + 8} x2={TG.cx - 24} y2={TG.peer - 2} tone={R.peer} dashed />
          <At x={TG.cx} y={TG.peer + 12} cx cy>
            <Gateway kind="peer" size={40} label="Peering Link" />
          </At>
        </div>
        <Ripple x={TG.cx} y={TG.gw} r={28} tone={colors.accent} on={forwards && t > 0.55} />
      </DomPart>
      <PacketChip x={pos[0]} y={pos[1]} on={showChip} tone={t < 0.36 ? colors.accent : R.gw} />

      <At x={235} y={PR.sealed} cx cy>
        <Tag lit={sealed}>Without Touching What It Carries</Tag>
      </At>
      <At x={235} y={PR.send} cx cy>
        <Tag lit={forwards}>Forwards the Packet</Tag>
      </At>
    </>
  )
}

export function PostalAnalogy({ lesson }: { lesson: string }) {
  const { t, focus } = usePostal()
  return (
    <IsoAnalogy
      id="T14-AN"
      kicker="Route Tables"
      title="A Postal Hub Reads Only the Pincode"
      lesson={lesson}
      bare
      h={AN_H}
      everyday={{ label: 'A Postal Hub Reads Only the Pincode', scene: <PostalFamiliar t={t} focus={focus} /> }}
      cloud={{ label: 'A route table reads only the destination address', scene: <PostalConcept t={t} focus={focus} /> }}
    />
  )
}

/* ============================================================== T16-AN · A Ticket Counter at a Venue */

const TR = { top: 26, foot: 366 } as const
const GROUND = 300
const BOOTH = { x: 212, w: 60, top: 186 } as const
const GATE = { x: 284, y: 254, len: 56 } as const
const LANE = { out: 318, back: 332, blocked: 346 } as const
/* the people are library renders (round 2, R7), FIG_H tall, about 49px wide: placed so no two overlap at rest */
const FIG_H = 84
const QUEUE = [50, 104] as const
const QUEUE_X = 160
const OUT_X = 368
const OUTSIDER = { from: 428, stop: GATE.x + GATE.len + 32, back: 428 } as const
const LAMP_X = 462

/** The ticket clock: 0 a visitor goes out through the counter and comes back; 1 an outsider walks up and is turned away; then the whole venue. */
function useTicket() {
  const held = useHeld()
  const t = useRestless(9000, [0.48, 0.94, 0.98], 0.92)
  const focus = held ? -1 : t <= 0.485 ? 0 : t <= 0.945 ? 1 : -1
  return { t: held ? 0.98 : t, focus }
}

function visitorAt(t: number) {
  const outS = within(t, 0.04, 0.2)
  const backS = within(t, 0.27, 0.44)
  const x = t < 0.27 ? lerp(QUEUE_X, OUT_X, outS) : lerp(OUT_X, QUEUE_X, backS)
  const dir: 1 | -1 = t < 0.235 || t > 0.46 ? 1 : -1
  const walking = (t > 0.04 && t < 0.2) || (t > 0.27 && t < 0.44)
  return { x, dir, walking, out: t > 0.04 && t < 0.235, back: t >= 0.235 && t < 0.46 }
}

function outsiderAt(t: number) {
  const inS = within(t, 0.52, 0.66)
  const backS = within(t, 0.78, 0.9)
  const x = t < 0.78 ? lerp(OUTSIDER.from, OUTSIDER.stop, inS) : lerp(OUTSIDER.stop, OUTSIDER.back, backS)
  const dir: 1 | -1 = t < 0.76 ? -1 : 1
  const walking = (t > 0.52 && t < 0.66) || (t > 0.78 && t < 0.9)
  const stopped = t >= 0.64 && t < 0.8
  return { x, dir, walking, stopped }
}

/** A ground lane arrow, its colour its path (G4). */
function Lane({ x1, x2, y, tone, on }: { x1: number; x2: number; y: number; tone: string; on: number }) {
  const dir = Math.sign(x2 - x1)
  return (
    <g style={{ opacity: on, transition: fadeT }}>
      <line x1={x1} y1={y} x2={x2 - dir * 8} y2={y} stroke={tone} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${x2} ${y} L ${x2 - dir * 10} ${y - 5.5} L ${x2 - dir * 10} ${y + 5.5} Z`} fill={tone} />
    </g>
  )
}

function TicketFamiliar({ t, focus }: { t: number; focus: number }) {
  const v = visitorAt(t)
  const o = outsiderAt(t)
  const gateUp = v.x > BOOTH.x + BOOTH.w - 10 && v.x < GATE.x + GATE.len + 14 && focus !== 1
  const opOut = opFor(focus, 0)
  const opIn = opFor(focus, 1)
  const RED = NET.blocked
  return (
    <>
      <svg className="absolute inset-0" width={AN_W} height={AN_H} viewBox={`0 0 ${AN_W} ${AN_H}`} aria-hidden>
        {/* the plaza inside, the pavement outside, a street lamp */}
        <rect x={6} y={GROUND} width={BOOTH.x + BOOTH.w - 6} height={8} rx={2} fill="#C9D3E3" />
        <rect x={BOOTH.x + BOOTH.w} y={GROUND} width={AN_W - BOOTH.x - BOOTH.w - 6} height={8} rx={2} fill="#B5BFCE" />
        <rect x={LAMP_X - 2} y={150} width={4} height={GROUND - 150} fill="#5B6478" />
        <path d={`M ${LAMP_X - 7} 150 Q ${LAMP_X} 141 ${LAMP_X + 7} 150 Z`} fill="#4A5B74" />
        <circle cx={LAMP_X} cy={152} r={3.2} fill="#FFE29A" className={STILL ? undefined : 'rt-bulb'} />

        {/* THE VENUE: a cinema hall, its marquee of bulbs, posters, the doors */}
        <rect x={14} y={78} width={178} height={GROUND - 78} rx={4} fill="#E3E9F8" stroke="#B3C2DF" />
        <rect x={8} y={70} width={190} height={12} rx={3} fill={colors.brandDark} />
        <rect x={34} y={96} width={138} height={34} rx={4} fill="#1B2433" />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={40 + i * 11.6} cy={99} r={2.2} fill="#FFC531" className={STILL ? undefined : 'rt-bulb'} style={{ animationDelay: `${(i % 2) * 0.6}s` }} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={`b${i}`} cx={40 + i * 11.6} cy={127} r={2.2} fill="#FFC531" className={STILL ? undefined : 'rt-bulb'} style={{ animationDelay: `${((i + 1) % 2) * 0.6}s` }} />
        ))}
        <rect x={60} y={107} width={86} height={12} rx={2} fill="#2D63FB" opacity={0.65} />
        {[28, 150].map((x) => (
          <g key={x}>
            <rect x={x} y={150} width={28} height={40} rx={2} fill="#FFFFFF" stroke="#9FB3D1" />
            <circle cx={x + 14} cy={164} r={6} fill={x < 100 ? '#FF8A3D' : '#7C3AED'} opacity={0.75} />
            <rect x={x + 5} y={176} width={18} height={3} rx={1.5} fill="#9FB3D1" />
          </g>
        ))}
        <rect x={72} y={200} width={64} height={GROUND - 200} rx={3} fill="#4A5B74" />
        <line x1={104} y1={200} x2={104} y2={GROUND} stroke="#8798B3" strokeWidth={1.2} />

        {/* THE TICKET COUNTER at the exit: a booth, its striped canopy with the ticket sign, the clerk at the window */}
        <rect x={BOOTH.x} y={BOOTH.top} width={BOOTH.w} height={GROUND - BOOTH.top} rx={3} fill="#F2C14E" stroke="#C99A1A" />
        {Array.from({ length: 5 }, (_, i) => (
          <rect key={i} x={BOOTH.x - 6 + i * 14.4} y={BOOTH.top - 12} width={7.2} height={12} fill={i % 2 ? '#FFFFFF' : colors.accent} />
        ))}
        <rect x={BOOTH.x - 6} y={BOOTH.top - 14} width={BOOTH.w + 12} height={3} rx={1.5} fill="#C2611F" />
        <rect x={BOOTH.x + 8} y={BOOTH.top + 12} width={BOOTH.w - 16} height={32} rx={3} fill="#DCE8FF" stroke="#9FB3D1" />
        {/* the clerk at the window: a library render, head and shoulders, behind the glass */}
        <clipPath id="rt-booth-window">
          <rect x={BOOTH.x + 9} y={BOOTH.top + 13} width={BOOTH.w - 18} height={30} rx={2.5} />
        </clipPath>
        <g clipPath="url(#rt-booth-window)">
          <LibFigure name="clerk" x={BOOTH.x + BOOTH.w / 2} y={BOOTH.top + 46} h={36} shadow={false} idle />
        </g>
        <polygon points={`${BOOTH.x + 14},${BOOTH.top + 43} ${BOOTH.x + 26},${BOOTH.top + 13} ${BOOTH.x + 31},${BOOTH.top + 13} ${BOOTH.x + 19},${BOOTH.top + 43}`} fill="#FFFFFF" opacity={0.3} />
        <rect x={BOOTH.x + 4} y={BOOTH.top + 44} width={BOOTH.w - 8} height={5} rx={1.5} fill="#C99A1A" />
        <g transform={`translate(${BOOTH.x + BOOTH.w / 2 - 10} ${BOOTH.top + 60})`}>
          <rect width={20} height={12} rx={2} fill="#FFFFFF" stroke="#C99A1A" />
          <line x1={7} y1={1} x2={7} y2={11} stroke="#C99A1A" strokeDasharray="1.6 1.4" />
        </g>

        {/* THE EXIT BARRIER beside it: it lifts for a visitor with a ticket, stays down for an outsider */}
        <rect x={GATE.x - 4} y={GATE.y - 6} width={10} height={GROUND - GATE.y + 6} rx={2} fill="#4A5B74" />
        <g style={{ transformOrigin: `${GATE.x}px ${GATE.y}px`, transform: `rotate(${gateUp ? -72 : 0}deg)`, transition: `transform 360ms ${EASE}` }}>
          <g className={o.stopped && focus === 1 && !STILL ? 'rt-gate-shake' : undefined} style={{ transformOrigin: `${GATE.x}px ${GATE.y}px`, transformBox: 'view-box' }}>
            <rect x={GATE.x} y={GATE.y - 3} width={GATE.len} height={6} rx={3} fill="#FFFFFF" stroke="#B3C2DF" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={GATE.x + 6 + i * 13} y={GATE.y - 3} width={6} height={6} fill={RED} />
            ))}
          </g>
        </g>

        {/* the queue inside, tickets in hand */}
        <LibFigure name="queue-a" x={QUEUE[0]} y={GROUND} h={FIG_H} idle>
          <Ticket x={FIG_H * 0.16} y={-FIG_H * 0.73} rot={-20} />
        </LibFigure>
        <LibFigure name="queue-b" x={QUEUE[1]} y={GROUND} h={FIG_H} idle>
          <Ticket x={FIG_H * 0.2} y={-FIG_H * 0.76} rot={-20} />
        </LibFigure>

        {/* the paths: out (blue), back (green), turned away (red) */}
        <Lane x1={QUEUE_X} x2={OUT_X} y={LANE.out} tone={colors.brand} on={focus < 0 ? 1 : focus === 0 && v.out ? 1 : 0.3} />
        <Lane x1={OUT_X} x2={QUEUE_X} y={LANE.back} tone={colors.success} on={focus < 0 ? 1 : focus === 0 && v.back ? 1 : 0.3} />
        <Lane x1={OUTSIDER.from} x2={GATE.x + GATE.len + 6} y={LANE.blocked} tone={RED} on={focus < 0 || focus === 1 ? 1 : 0.3} />

        {/* the visitor going out and back; the outsider turned away */}
        <LibFigure name="visitor" x={v.x} y={GROUND} h={FIG_H} dir={v.dir} walking={v.walking} idle opacity={opOut}>
          <Ticket x={-FIG_H * 0.17} y={-FIG_H * 0.75} rot={14} />
        </LibFigure>
        <LibFigure name="outsider" x={o.x} y={GROUND} h={FIG_H} walking={o.walking} idle opacity={opIn} />
      </svg>
      <At x={GATE.x + GATE.len / 2} y={GATE.y - 26} cx cy style={{ zIndex: 5 }}>
        <span className={o.stopped && focus === 1 ? fx('shake', 0, 1.2).className : undefined} style={{ ...(o.stopped && focus === 1 ? fx('shake', 0, 1.2).style : {}), display: 'block' }}>
          <NoMark size={24} on={(o.stopped && focus === 1) || focus < 0} />
        </span>
      </At>

      <At x={180} y={TR.top} cx cy>
        <Tag lit={focus === 0}>Visitors Inside Can Go Out and Return</Tag>
      </At>
      <At x={BOOTH.x + BOOTH.w / 2} y={BOOTH.top - 34} cx cy>
        <Tag>Ticket Counter</Tag>
      </At>
      <div style={{ opacity: opOut, transition: fadeT }}>
        <At x={352} y={188} cx cy>
          <Tag lit={focus === 0}>Using Their Tickets</Tag>
        </At>
      </div>
      <div style={{ opacity: opIn, transition: fadeT }}>
        <At x={384} y={110} cx cy>
          <Tag lit={focus === 1}>Without Permission</Tag>
        </At>
      </div>
      <At x={AN_W / 2} y={TR.foot} cx cy>
        <Tag lit={focus === 1}>Outsiders Cannot Enter Through the Exit</Tag>
      </At>
    </>
  )
}

const TC = { sub: { x: 16, y: 92, w: 176, h: 200 }, nat: { cx: 262, cy: 196, r: 24 }, cloud: { x: 352, y: 150, w: 104 }, out: 182, back: 210, blocked: 268 } as const
const SUB_R = TC.sub.x + TC.sub.w

function TicketConcept({ t, focus }: { t: number; focus: number }) {
  const out = focus === 0
  const blocked = focus === 1
  const v = visitorAt(t)
  const o = outsiderAt(t)
  const natL = TC.nat.cx - TC.nat.r - 2
  const natR = TC.nat.cx + TC.nat.r + 2
  const cloudL = TC.cloud.x + 6
  /* the packet rides with the visitor: out along the blue lane while the visitor walks out, back along the green lane while they walk back */
  const goS = within(t, 0.04, 0.2)
  const backS = within(t, 0.27, 0.44)
  const pkt = t < 0.235 ? along([SUB_R - 30, TC.out], [cloudL + 20, TC.out], goS) : along([cloudL + 20, TC.back], [SUB_R - 30, TC.back], backS)
  const inPkt = along([cloudL + 30, TC.blocked], [natR + 14, TC.blocked], within(t, 0.52, 0.66))
  const laneOp = (on: boolean) => (focus < 0 || on ? 1 : 0.3)
  return (
    <>
      <At x={235} y={TR.top} cx cy>
        <Tag lit={out}>Private Instances Start Outbound Connections</Tag>
      </At>
      {/* the private subnet: its instances queued like the visitors */}
      <At x={TC.sub.x} y={TC.sub.y}>
        <SubnetBox w={TC.sub.w} h={TC.sub.h} kind="private" label="Private Subnet">
          {[0, 1, 2].map((i) => (
            <At key={i} x={i === 0 ? TC.sub.w / 2 : TC.sub.w / 2 - 28 + (i - 1) * 56} y={i === 0 ? 88 : 150} cx cy>
              <Resource size={i === 0 ? 46 : 36} lit={i === 0 && out} dim={i > 0 && focus >= 0} />
            </At>
          ))}
        </SubnetBox>
      </At>
      {/* the NAT gateway at the way out: the counter */}
      <At x={TC.nat.cx} y={TC.nat.cy + 14} cx cy>
        <Gateway kind="nat" size={TC.nat.r * 2} lit={out || blocked} label="NAT Gateway" />
      </At>
      <Ripple x={TC.nat.cx} y={TC.nat.cy} r={32} tone={blocked ? NET.blocked : colors.accent} on={(out && (v.out || v.back)) || (blocked && o.stopped)} />
      <At x={TC.cloud.x} y={TC.cloud.y}>
        <span className={fx('lift', 0, 3.2).className} style={{ ...fx('lift', 0, 3.2).style, display: 'block' }}>
          <InternetCloud w={TC.cloud.w} label="Internet" />
        </span>
      </At>
      {/* out (blue) and back (green), through the gateway */}
      <div style={{ opacity: laneOp(out && v.out), transition: fadeT }}>
        <Arrow x1={SUB_R + 2} y1={TC.out} x2={natL} y2={TC.out} tone={colors.brand} />
        <Arrow x1={natR} y1={TC.out} x2={cloudL - 2} y2={TC.out} tone={colors.brand} />
      </div>
      <div style={{ opacity: laneOp(out && v.back), transition: fadeT }}>
        <Arrow x1={cloudL - 2} y1={TC.back} x2={natR} y2={TC.back} tone={colors.success} />
        <Arrow x1={natL} y1={TC.back} x2={SUB_R + 2} y2={TC.back} tone={colors.success} />
      </div>
      <PacketChip x={pkt[0]} y={pkt[1]} on={!STILL && out && (v.out || v.back)} tone={v.out ? colors.brand : colors.success} />
      {/* anything started from outside is stopped at the gateway (red) */}
      <div style={{ opacity: laneOp(blocked), transition: fadeT }}>
        <Arrow x1={cloudL + 14} y1={TC.blocked} x2={natR + 18} y2={TC.blocked} tone={NET.blocked} />
        <At x={natR + 4} y={TC.blocked} cx cy>
          <span className={blocked && o.stopped ? fx('shake', 0, 1.2).className : undefined} style={{ ...(blocked && o.stopped ? fx('shake', 0, 1.2).style : {}), display: 'block' }}>
            <NoMark size={24} />
          </span>
        </At>
      </div>
      <PacketChip x={inPkt[0]} y={inPkt[1]} on={!STILL && blocked && t > 0.52 && t < 0.8} tone={NET.blocked} />
      <At x={235} y={TR.foot} cx cy>
        <Tag lit={blocked}>Blocking Anything Started From Outside</Tag>
      </At>
    </>
  )
}

export function TicketAnalogy({ lesson }: { lesson: string }) {
  const { t, focus } = useTicket()
  return (
    <IsoAnalogy
      id="T16-AN"
      kicker="NAT Gateway"
      title="A Ticket Counter at a Venue"
      lesson={lesson}
      bare
      h={AN_H}
      everyday={{ label: 'A Ticket Counter at a Venue', scene: <TicketFamiliar t={t} focus={focus} /> }}
      cloud={{ label: 'A NAT gateway for a private subnet', scene: <TicketConcept t={t} focus={focus} /> }}
    />
  )
}

/* ============================================================== T17-AN · A private telephone line */

const PL = { top1: 26, top2: 58, foot: 366 } as const
/* the two office towers in 3D (round 2): front faces, the receding side walls face the centre */
const OFF = { top: 104, foot: 296, w: 144, fx: [14, 470 - 14 - 144] as const }
const SIDE_X = [OFF.fx[0] + OFF.w + 18 / 2, OFF.fx[1] - 18 / 2] as const
const LINE_Y = 150
/* the junction boxes on the side walls, the cable between their outer edges */
const JL: [number, number] = [SIDE_X[0] + 11, LINE_Y]
const JR: [number, number] = [SIDE_X[1] - 11, LINE_Y]
const SAG = 28
const EXCH = { fx: 192, w: 86, top: 268, foot: 334 }
/* inside each lobby: the desk, the person, the phone */
const DESK_Y = 258
const LOBBY = [
  { person: OFF.fx[0] + 50, phone: OFF.fx[0] + 114, desk: [OFF.fx[0] + 16, OFF.fx[0] + 136] as const, toward: -1 as const },
  { person: OFF.fx[1] + OFF.w - 50, phone: OFF.fx[1] + 30, desk: [OFF.fx[1] + 8, OFF.fx[1] + 128] as const, toward: 1 as const },
]

/** The phone clock: 0 a call goes straight down the private line and connects; 1 the public exchange sits unused; then the whole picture. */
function usePhone() {
  const held = useHeld()
  const t = useRestless(8400, [0.5, 0.94, 0.98], 0.945)
  const focus = held ? -1 : t <= 0.505 ? 0 : t <= 0.945 ? 1 : -1
  return { t: held ? 0.98 : t, focus }
}

/** The private line's sag: the point at `s` along the cable. */
function linePt(s: number): [number, number] {
  const c: [number, number] = [(JL[0] + JR[0]) / 2, LINE_Y + SAG]
  return [(1 - s) * (1 - s) * JL[0] + 2 * (1 - s) * s * c[0] + s * s * JR[0], (1 - s) * (1 - s) * JL[1] + 2 * (1 - s) * s * c[1] + s * s * JR[1]]
}

function PhoneFamiliar({ t, focus }: { t: number; focus: number }) {
  const direct = focus === 0
  const bypass = focus === 1
  /* the call: the left handset lifts, a pulse runs the line, the right phone rings, it is picked up, both talk */
  const lifted = t > 0.04 || focus < 0
  const pulse = within(t, 0.08, 0.22)
  const ringing = direct && t > 0.22 && t < 0.32
  const answered = (t >= 0.32 && t < 0.5) || focus < 0
  const talking = direct && answered
  const carrying = direct && t > 0.08
  const [px, py] = linePt(pulse)
  const opD = opFor(focus, 0)
  const cable = `M ${JL[0]} ${JL[1]} Q ${(JL[0] + JR[0]) / 2} ${LINE_Y + SAG} ${JR[0]} ${JR[1]}`
  /* the public routes (grey, unused): from each tower's foot to the exchange's sides */
  const exL = `M ${SIDE_X[0]} ${OFF.foot - 10} Q ${SIDE_X[0] + 4} ${EXCH.foot - 22} ${EXCH.fx - 4} ${EXCH.foot - 22}`
  const exR = `M ${SIDE_X[1]} ${OFF.foot - 10} Q ${SIDE_X[1] - 4} ${EXCH.foot - 22} ${EXCH.fx + EXCH.w + 4} ${EXCH.foot - 22}`
  return (
    <>
      <svg className="absolute inset-0" width={AN_W} height={AN_H} viewBox={`0 0 ${AN_W} ${AN_H}`} aria-hidden>
        <Art3dDefs />
        {/* the street the offices and the exchange stand on */}
        <rect x={6} y={OFF.foot} width={AN_W - 12} height={6} rx={2} fill="#C9D3E3" />

        {/* the public exchange, below, with the routes that would run through it (grey, unused) */}
        <g style={{ opacity: bypass || focus < 0 ? 1 : 0.32, transition: fadeT }}>
          <path d={exL} fill="none" stroke="#9AA6B8" strokeWidth={1.5} strokeDasharray="5 5" />
          <path d={exR} fill="none" stroke="#9AA6B8" strokeWidth={1.5} strokeDasharray="5 5" />
          <Exchange3D fx={EXCH.fx} w={EXCH.w} top={EXCH.top} foot={EXCH.foot} />
        </g>

        {/* the two offices; in each lobby a person at a desk with a desk phone */}
        {OFF.fx.map((fx, i) => {
          const L = LOBBY[i]
          return (
            <Office3D
              key={fx}
              id={`ph${i}`}
              fx={fx}
              w={OFF.w}
              top={OFF.top}
              foot={OFF.foot}
              side={i === 0 ? 1 : -1}
              lobby={
                <g style={{ opacity: opD, transition: fadeT }}>
                  <LibFigure name={i === 0 ? 'caller' : 'receiver'} x={L.person} y={DESK_Y + 22} h={74} shadow={false} idle />
                  <Desk3D x0={L.desk[0]} x1={L.desk[1]} y={DESK_Y} foot={OFF.foot - 6} />
                  <Phone3D x={L.phone} y={DESK_Y - 3} toward={L.toward} off={i === 0 ? lifted : answered} ring={i === 1 && ringing} talk={talking} />
                </g>
              }
            />
          )
        })}

        {/* THE PRIVATE LINE: a junction box on each office, one cable between them and nothing else; a conduit down each wall to the lobby */}
        <g style={{ opacity: opD, transition: fadeT }}>
          {SIDE_X.map((x) => (
            <line key={x} x1={x} y1={LINE_Y + 12} x2={x} y2={OFF.foot - 40} stroke="#4A5B74" strokeWidth={2.4} strokeLinecap="round" />
          ))}
          <path d={cable} fill="none" stroke="#1E3A8A" strokeWidth={direct ? 6 : 5} strokeLinecap="round" />
          <path d={cable} fill="none" stroke={colors.brand} strokeWidth={direct ? 3.6 : 3} strokeLinecap="round" />
          <path d={cable} fill="none" stroke="#9CC0FF" strokeWidth={1} strokeLinecap="round" transform="translate(0 -1.2)" opacity={0.8} />
          {talking && !STILL && <path d={cable} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="5 9" className="mo mo-dash" />}
          <JunctionBox x={SIDE_X[0]} y={LINE_Y} lit={carrying} />
          <JunctionBox x={SIDE_X[1]} y={LINE_Y} lit={carrying} />
          {!STILL && direct && pulse > 0 && pulse < 1 && <circle cx={px} cy={py} r={6} fill={colors.accent} stroke="#FFFFFF" strokeWidth={2} />}
        </g>
      </svg>
      <At x={EXCH.fx + EXCH.w / 2} y={EXCH.top + 26} cx cy style={{ opacity: bypass ? 1 : 0, transition: fadeT }}>
        <span className={bypass ? fx('shake', 0, 1.6).className : undefined} style={{ ...(bypass ? fx('shake', 0, 1.6).style : {}), display: 'block' }}>
          <NoMark size={26} />
        </span>
      </At>
      <Ripple x={LOBBY[1].phone} y={DESK_Y - 16} r={22} tone={colors.accent} on={ringing} />

      <At x={235} y={PL.top1} cx cy>
        <Tag lit={direct}>A Private Telephone Line</Tag>
      </At>
      <At x={235} y={PL.top2} cx cy>
        <Tag lit={direct}>Installed Directly Between Two Offices</Tag>
      </At>
      {OFF.fx.map((x) => (
        <At key={x} x={x + OFF.w / 2} y={OFF.foot + 22} cx cy>
          <Tag>Office</Tag>
        </At>
      ))}
      <At x={235} y={PL.foot} cx cy>
        <Tag lit={bypass}>Bypassing the Public Telephone Exchange Entirely</Tag>
      </At>
    </>
  )
}

const VPC_AN = { w: 124, h: 116, y: 128, x: [24, 322] as const }
const PEER_Y = VPC_AN.y + VPC_AN.h / 2
const NETC = { cx: 235, y: 266, w: 84 }

function PhoneConcept({ t, focus }: { t: number; focus: number }) {
  const direct = focus === 0
  const bypass = focus === 1
  const x1 = VPC_AN.x[0] + VPC_AN.w + 2
  const x2 = VPC_AN.x[1] - 2
  const go = within(t, 0.08, 0.22)
  const back = within(t, 0.32, 0.46)
  const pos = t < 0.3 ? along([x1 + 14, PEER_Y], [x2 - 14, PEER_Y], go) : along([x2 - 14, PEER_Y], [x1 + 14, PEER_Y], back)
  const moving = direct && ((t > 0.08 && t < 0.22) || (t > 0.32 && t < 0.46))
  const opD = opFor(focus, 0)
  return (
    <>
      <At x={235} y={PL.top1} cx cy>
        <Tag lit={direct}>Peered Traffic Moves Straight</Tag>
      </At>
      <At x={235} y={PL.top2} cx cy>
        <Tag lit={direct}>Between the Two VPCs</Tag>
      </At>
      {/* the public internet below, with the routes that would run through it (grey, unused) */}
      <div style={{ opacity: bypass || focus < 0 ? 1 : 0.32, transition: fadeT }}>
        <svg className="absolute inset-0" width={AN_W} height={AN_H} aria-hidden>
          <path d={`M ${VPC_AN.x[0] + VPC_AN.w - 20} ${VPC_AN.y + VPC_AN.h + 2} Q ${VPC_AN.x[0] + VPC_AN.w} ${NETC.y + 30} ${NETC.cx - NETC.w / 2 - 6} ${NETC.y + 30}`} fill="none" stroke="#9AA6B8" strokeWidth={1.5} strokeDasharray="5 5" />
          <path d={`M ${VPC_AN.x[1] + 20} ${VPC_AN.y + VPC_AN.h + 2} Q ${VPC_AN.x[1]} ${NETC.y + 30} ${NETC.cx + NETC.w / 2 + 6} ${NETC.y + 30}`} fill="none" stroke="#9AA6B8" strokeWidth={1.5} strokeDasharray="5 5" />
        </svg>
        <At x={NETC.cx} y={NETC.y} cx>
          <InternetCloud w={NETC.w} label="Public Internet" />
        </At>
      </div>
      <At x={NETC.cx + 40} y={NETC.y + 8} cx cy style={{ opacity: bypass ? 1 : 0, transition: fadeT, zIndex: 5 }}>
        <span className={bypass ? fx('shake', 0, 1.6).className : undefined} style={{ ...(bypass ? fx('shake', 0, 1.6).style : {}), display: 'block' }}>
          <NoMark size={26} />
        </span>
      </At>
      {/* the two VPCs and the peering line straight between them */}
      <div style={{ opacity: opD, transition: fadeT }}>
        {VPC_AN.x.map((x, i) => (
          <At key={x} x={x} y={VPC_AN.y}>
            <Boundary w={VPC_AN.w} h={VPC_AN.h} label="VPC" lit={direct && ((i === 0 && t < 0.3) || (i === 1 && t >= 0.22))} style={{ border: `1.5px dashed ${NET.boundary}` }}>
              <At x={VPC_AN.w / 2} y={VPC_AN.h / 2 + 6} cx cy>
                <Resource size={44} />
              </At>
            </Boundary>
          </At>
        ))}
        <Arrow x1={x1} y1={PEER_Y} x2={x2} y2={PEER_Y} both tone={colors.brand} width={direct ? 3.5 : 2.5} />
      </div>
      <PacketChip x={pos[0]} y={pos[1]} on={!STILL && moving} tone={colors.brand} />
      <At x={235} y={PL.foot} cx cy>
        <Tag lit={bypass}>Without Touching the Public Internet</Tag>
      </At>
    </>
  )
}

export function PhoneLineAnalogy({ lesson }: { lesson: string }) {
  const { t, focus } = usePhone()
  return (
    <IsoAnalogy
      id="T17-AN"
      kicker="VPC Peering"
      title="A Private Telephone Line Between Two Offices"
      lesson={lesson}
      bare
      h={AN_H}
      everyday={{ label: 'A Private Telephone Line Between Two Offices', scene: <PhoneFamiliar t={t} focus={focus} /> }}
      cloud={{ label: 'Peered traffic moves straight between two VPCs', scene: <PhoneConcept t={t} focus={focus} /> }}
    />
  )
}

/** The analogies' own keyframes (a scan line down the route table's Destination column, the barrier shaking). */
export const ROUTING_AN_CSS = `
@keyframes rt-scan { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(74px); opacity: 0 } }
.rt-scan { animation: rt-scan 1.1s ease-in-out infinite; }
@keyframes rt-gate-shake { 0%, 100% { transform: rotate(0deg) } 25% { transform: rotate(-3deg) } 75% { transform: rotate(3deg) } }
.rt-gate-shake { animation: rt-gate-shake 0.4s ease-in-out infinite; }
.cc-still .rt-scan, .deck-thumb .rt-scan, .cc-still .rt-gate-shake, .deck-thumb .rt-gate-shake { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .rt-scan, .rt-gate-shake { animation: none !important; } }
`
