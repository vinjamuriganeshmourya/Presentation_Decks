import type { CSSProperties } from 'react'
import { KeyRound, ScanSearch, ShieldCheck } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { At, Label, REDUCED, STILL, useCycle } from '../scene'
import { useAutoAnim } from '@/deck/autoAnim'
import { AN_W, IsoAnalogy } from '../iso/frames'
import { Box, ISO, IsoAt, IsoScene, IsoSvg, P, Quad, Shadow, pts, shade } from '../iso/iso'
import { Badge, CvIcon, iconUrl } from './fx'

/**
 * T19-AN · A TWO-WAY ACCESS DOOR, AND A CAMPUS CHECKPOINT (visual pass, 2026-11-04).
 *
 * The TR's analogy as one walk, told twice: a visitor comes up the road to the
 * campus gate, where the guard at the SECURITY CHECKPOINT checks them and the
 * boom barrier lifts; they cross the campus to the office's TWO-WAY DOOR, where
 * the ELECTRONIC ACCESS SYSTEM reads their card and the door slides open. On the
 * way OUT the door opens by itself (it remembers who came in: stateful), but the
 * checkpoint checks them AGAIN (it remembers nothing: stateless). The concept
 * picture beside it walks a packet through the same two places: the network ACL
 * on the subnet's edge (the campus fence and its gate) and the security group on
 * the instance (the building's door).
 *
 * Two filters, two colours (G4): the checkpoint and the network ACL in teal, the
 * door and the security group in blue. The part being walked is lit and the other
 * filter fades. ONE clock for both pictures (`useCycle`, one step track):
 *   0  the whole picture, the visitor and the packet outside
 *   1  the checkpoint, on the way in      (teal lit)
 *   2  the door, on the way in            (blue lit, the card is read)
 *   3  the door, on the way out           (blue lit, it opens by itself)
 *   4  the checkpoint, on the way out     (teal lit, checked again)
 * Auto ON it loops; OFF one press per state. Harness URLs hold state 0.
 * Every tag is the TR's words, already on this card.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const WALK = 'cubic-bezier(0.45,0,0.55,1)'
export const SG_TONE = colors.brand
export const ACL_TONE = colors.teal
const FADE = 0.28

type Focus = 'none' | 'acl' | 'sg'
const focusOf = (k: number): Focus => (k === 1 || k === 4 ? 'acl' : k === 2 || k === 3 ? 'sg' : 'none')

/* ------------------------------------------------------------------ the familiar picture */

/** A person from the library, standing with their feet on (x, y) of the scene; `bob` a small step while they walk. */
function Figure({ src, h, x, y, bob = false }: { src: string; h: number; x: number; y: number; bob?: boolean }) {
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ left: x, top: y - h, height: h, width: 'max-content', transform: 'translateX(-50%)' }}>
      <img src={src} alt="" draggable={false} className={`block w-auto max-w-none select-none ${bob ? 'sec-anim sec-lift' : ''}`} style={{ height: h, filter: 'drop-shadow(0 6px 5px rgba(16,32,58,0.22))' }} />
    </span>
  )
}

const AH = 400
const UU = 40
/* the campus plot, the office, its door, the gate, the road outside, the guard's booth */
const CAMPUS = { x: 0, y: 0, w: 4.6, d: 3.6 } as const
const OFFICE = { x: 0.8, y: 0.35, w: 2.9, d: 1.45, h: 2.3 } as const
const DOOR = { a: 0.6, b: 1.3, h: 1.3 } as const // along the office's front face, in grid units from its left corner
const GATE = { x1: 1.25, x2: 2.25, y: CAMPUS.d } as const
const ROAD = { x: 1.25, y: CAMPUS.d, w: 1.0, d: 1.8 } as const
const BOOTH = { x: 2.78, y: 4.3, w: 0.72, d: 0.72, h: 1.25 } as const
const POST = { x: 2.37, y: GATE.y + 0.07, z: 0.6 } as const
const WALK_X = OFFICE.x + (DOOR.a + DOOR.b) / 2
/* the visitor's stops: outside on the road, inside the gate, at the door */
const STOP = { out: 5.0, gate: 2.55, door: OFFICE.y + OFFICE.d + 0.26 } as const
const OX = 249
const OY = 128

function visitorY(k: number) {
  return k === 1 || k === 3 ? STOP.gate : k === 2 ? STOP.door : STOP.out
}

/** A tree: a trunk and a two-tier canopy. */
function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <Shadow x={x - 0.3 * s} y={y - 0.3 * s} w={0.6 * s} d={0.6 * s} grow={0.05} opacity={0.12} />
      <Box x={x - 0.06} y={y - 0.06} w={0.12} d={0.12} h={0.5 * s} color="#8B6B4A" />
      <Box x={x - 0.32 * s} y={y - 0.32 * s} z={0.45 * s} w={0.64 * s} d={0.64 * s} h={0.42 * s} color="#5FAE6A" />
      <Box x={x - 0.2 * s} y={y - 0.2 * s} z={0.87 * s} w={0.4 * s} d={0.4 * s} h={0.3 * s} color="#6DBE78" />
    </g>
  )
}

/** The campus fence: posts and two rails along the plot's edge, the gate left open in the front edge. */
function FenceRun({ from, to }: { from: [number, number]; to: [number, number] }) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1])
  const n = Math.max(1, Math.round(len / 0.6))
  const posts = Array.from({ length: n + 1 }, (_, i) => [from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n] as [number, number])
  const rail = (z: number) => pts([P(from[0], from[1], z, UU), P(to[0], to[1], z, UU)])
  return (
    <g>
      <polyline points={rail(0.42)} fill="none" stroke={shade(ACL_TONE, -0.2)} strokeWidth={2} strokeLinecap="round" />
      <polyline points={rail(0.22)} fill="none" stroke={shade(ACL_TONE, -0.2)} strokeWidth={2} strokeLinecap="round" />
      {posts.map(([x, y], i) => {
        const [a, b] = P(x, y, 0, UU)
        const [c, d] = P(x, y, 0.52, UU)
        return <line key={i} x1={a} y1={b} x2={c} y2={d} stroke={shade(ACL_TONE, -0.35)} strokeWidth={3} strokeLinecap="round" />
      })}
    </g>
  )
}

/** The office's front face: windows on two floors, the sliding two-way door, and the card reader beside it. */
function OfficeFront({ open, read }: { open: boolean; read: boolean }) {
  const instant = useInstant()
  const fw = OFFICE.w * UU
  const fh = OFFICE.h * UU
  const da = DOOR.a * UU
  const dw = (DOOR.b - DOOR.a) * UU
  const dh = DOOR.h * UU
  const top = fh - dh
  const leaf = dw / 2
  const slide = open ? leaf * 0.9 : 0
  const t = instant ? 'none' : `transform 520ms ${EASE}`
  const win = (a: number, b: number) => <rect key={`${a}-${b}`} x={a} y={b} width={fw * 0.13} height={fh * 0.2} rx={1.5} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={0.8} />
  return (
    <g>
      {[0.06, 0.62, 0.8].map((a) => win(fw * a, fh * 0.12))}
      {[0.62, 0.8].map((a) => win(fw * a, fh * 0.5))}
      {win(fw * 0.04, fh * 0.5)}
      {/* the doorway: dark inside, a blue frame, two glass leaves that slide apart */}
      <rect x={da - 3} y={top - 3} width={dw + 6} height={dh + 3} rx={2} fill={shade(SG_TONE, -0.25)} />
      <rect x={da} y={top} width={dw} height={dh} fill="#1B2A44" />
      <rect x={da} y={top} width={leaf} height={dh} fill="#BFD6FF" stroke={shade(SG_TONE, -0.1)} strokeWidth={1} style={{ transform: `translateX(${-slide}px)`, transition: t }} />
      <rect x={da + leaf} y={top} width={leaf} height={dh} fill="#BFD6FF" stroke={shade(SG_TONE, -0.1)} strokeWidth={1} style={{ transform: `translateX(${slide}px)`, transition: t }} />
      {/* the electronic access system: a reader plate with its light */}
      <rect x={da + dw + 7} y={top + dh * 0.28} width={9} height={14} rx={2} fill={colors.brandDeep} />
      <circle cx={da + dw + 11.5} cy={top + dh * 0.28 + 4.5} r={2.4} fill={read ? colors.success : '#7A8BA6'} style={{ transition: instant ? 'none' : `fill 260ms ${EASE}` }} />
      {/* the floor line between the two storeys */}
      <line x1={0} y1={fh * 0.42} x2={fw} y2={fh * 0.42} stroke="#9FB3D1" strokeWidth={1} />
    </g>
  )
}

function CampusScene({ k }: { k: number }) {
  const instant = useInstant()
  const focus = focusOf(k)
  const acl = focus === 'acl'
  const sg = focus === 'sg'
  const opAcl = focus === 'sg' ? FADE : 1
  const opSg = focus === 'acl' ? FADE : 1
  const fadeT = instant ? 'none' : `opacity 460ms ${EASE}`
  /* the barrier lifts while the checkpoint checks (in and out); the door opens for the visitor both ways */
  const up = acl
  const open = sg
  const read = k === 2
  /* the visitor: a walk along the path, starting once the barrier is up or the door is open */
  const [vx, vy] = P(WALK_X, visitorY(k), 0, UU)
  const guard = P(BOOTH.x + BOOTH.w + 0.2, BOOTH.y + 0.3, 0, UU)
  const walkT = instant ? 'none' : `transform 1500ms ${WALK} 450ms`
  /* the boom: a striped arm from the post's head across the gate, turning about the head */
  const [px, py] = P(POST.x, POST.y, POST.z, UU)
  const [ex, ey] = P(GATE.x1 - 0.05, POST.y, POST.z, UU)
  const armLen = Math.hypot(ex - px, ey - py)
  const armAng = (Math.atan2(ey - py, ex - px) * 180) / Math.PI
  const door = P(OFFICE.x + DOOR.a, OFFICE.y + OFFICE.d, 0.55, UU).map((v, i) => v + (i ? OY : OX))
  const reader = P(OFFICE.x + DOOR.b + 0.22, OFFICE.y + OFFICE.d, 0.62, UU).map((v, i) => v + (i ? OY : OX))
  const lit = (on: boolean, tone: string, ink = colors.white): CSSProperties => (on ? { background: tone, color: ink, boxShadow: `inset 0 0 0 1.5px ${tone}, 0 8px 16px -10px rgba(16,32,58,0.45)` } : { boxShadow: `inset 0 0 0 1.5px ${tone}, 0 8px 16px -10px rgba(16,32,58,0.35)` })
  return (
    <IsoScene w={AN_W} h={AH} ox={OX} oy={OY} u={UU}>
      <IsoSvg>
        {/* the ground: grass, the campus plot inside its fence, the road out through the gate */}
        <Quad x={-0.3} y={-0.3} w={5.2} d={5.9} fill={ISO.grass} opacity={0.38} />
        <Quad x={CAMPUS.x} y={CAMPUS.y} w={CAMPUS.w} d={CAMPUS.d} fill="#EAF6EC" opacity={0.95} />
        <g style={{ opacity: opAcl, transition: fadeT }}>
          <Quad x={ROAD.x} y={ROAD.y} w={ROAD.w} d={ROAD.d} fill={ISO.slate} opacity={0.85} />
          <Quad x={ROAD.x + ROAD.w / 2 - 0.025} y={ROAD.y + 0.2} w={0.05} d={ROAD.d - 0.3} fill={colors.white} opacity={0.6} />
          <Quad x={GATE.x1} y={GATE.y - 0.08} w={GATE.x2 - GATE.x1} d={0.16} fill={ACL_TONE} opacity={acl ? 0.6 : 0.25} style={{ transition: fadeT }} />
        </g>
        {/* the footpath from the gate to the door */}
        <Quad x={WALK_X - 0.32} y={OFFICE.y + OFFICE.d} w={0.64} d={CAMPUS.d - OFFICE.y - OFFICE.d} fill={ISO.paper} opacity={0.95} />
        {/* the back and side fence runs (behind everything) */}
        <g style={{ opacity: opAcl, transition: fadeT }}>
          <FenceRun from={[0, 0]} to={[CAMPUS.w, 0]} />
          <FenceRun from={[CAMPUS.w, 0]} to={[CAMPUS.w, CAMPUS.d]} />
          <FenceRun from={[0, 0]} to={[0, CAMPUS.d]} />
        </g>
        <Tree x={4.1} y={0.6} s={1.05} />
        {/* the office, its front door and reader on the face toward the gate */}
        <g style={{ opacity: focus === 'acl' ? 0.45 : 1, transition: fadeT }}>
          <Shadow x={OFFICE.x} y={OFFICE.y} w={OFFICE.w} d={OFFICE.d} grow={0.2} opacity={0.14} />
          <Box x={OFFICE.x} y={OFFICE.y} w={OFFICE.w} d={OFFICE.d} h={OFFICE.h} color="#C9D6EA" onLeft={<OfficeFront open={open} read={read} />} />
          <Box x={OFFICE.x - 0.08} y={OFFICE.y - 0.08} z={OFFICE.h} w={OFFICE.w + 0.16} d={OFFICE.d + 0.16} h={0.12} color="#9FB0C9" />
          <Box x={OFFICE.x + 0.35} y={OFFICE.y + 0.25} z={OFFICE.h + 0.12} w={0.55} d={0.45} h={0.26} color="#AEBBD0" />
        </g>
        <Tree x={4.05} y={2.6} />
        <Tree x={0.35} y={2.75} s={0.9} />
        {/* the blue glow at the door when it is the part in focus */}
        <g style={{ opacity: sg ? 1 : 0, transition: fadeT }}>
          <Quad x={WALK_X - 0.5} y={OFFICE.y + OFFICE.d} w={1.0} d={0.45} fill={SG_TONE} opacity={0.3} />
        </g>
        {/* the front fence runs either side of the gate, in front of the path */}
        <g style={{ opacity: opAcl, transition: fadeT }}>
          <FenceRun from={[0, CAMPUS.d]} to={[GATE.x1 - 0.06, CAMPUS.d]} />
          <FenceRun from={[GATE.x2 + 0.22, CAMPUS.d]} to={[CAMPUS.w, CAMPUS.d]} />
          {/* the boom barrier: its post, and the arm that lifts */}
          <Box x={POST.x - 0.08} y={POST.y - 0.08} w={0.16} d={0.16} h={POST.z + 0.05} color="#5B6F8A" />
          <g style={{ transformOrigin: `${px}px ${py}px`, transform: `rotate(${up ? 48 : 0}deg)`, transition: instant ? 'none' : `transform 520ms ${EASE}` }}>
            <line x1={px} y1={py} x2={px + Math.cos((armAng * Math.PI) / 180) * armLen} y2={py + Math.sin((armAng * Math.PI) / 180) * armLen} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
            <line x1={px} y1={py} x2={px + Math.cos((armAng * Math.PI) / 180) * armLen} y2={py + Math.sin((armAng * Math.PI) / 180) * armLen} stroke={colors.danger} strokeWidth={5} strokeLinecap="butt" strokeDasharray="8 8" />
          </g>
          <circle cx={px} cy={py} r={4} fill="#3B4B63" />
          {/* the guard's booth just outside the gate, the guard beside it */}
          <Shadow x={BOOTH.x} y={BOOTH.y} w={BOOTH.w} d={BOOTH.d} grow={0.1} opacity={0.14} />
          <Box x={BOOTH.x} y={BOOTH.y} w={BOOTH.w} d={BOOTH.d} h={BOOTH.h} color="#E8EEF6" onLeft={<rect x={4} y={5} width={BOOTH.w * UU - 8} height={BOOTH.h * UU * 0.36} rx={2} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={0.8} />} onRight={<rect x={4} y={5} width={BOOTH.d * UU - 8} height={BOOTH.h * UU * 0.36} rx={2} fill={ISO.glass} stroke="#9FB3D1" strokeWidth={0.8} />} />
          <Box x={BOOTH.x - 0.08} y={BOOTH.y - 0.08} z={BOOTH.h} w={BOOTH.w + 0.16} d={BOOTH.d + 0.16} h={0.09} color={ACL_TONE} />
        </g>
      </IsoSvg>

      {/* the people: the library's 3D figures (FS review, slide 47: realistic, the deck's one family), each moving as a whole image */}
      <Figure src={iconUrl('security-guard')} h={58} x={OX + guard[0]} y={OY + guard[1]} />
      <div className="pointer-events-none absolute left-0 top-0" style={{ transform: `translate(${OX + vx}px, ${OY + vy}px)`, transition: walkT, zIndex: 2 }}>
        <Figure src={iconUrl('security-visitor')} h={62} x={0} y={0} bob />
      </div>

      {/* the checks, as they happen: the guard looks, the reader takes the card */}
      <IsoAt x={BOOTH.x + BOOTH.w / 2} y={BOOTH.y + BOOTH.d / 2} z={BOOTH.h + 0.4} dx={k === 4 ? 44 : -44} cy>
        <Badge on={acl} ring={ACL_TONE} size={32} style={{ color: shade(ACL_TONE, -0.25) }}>
          <ScanSearch size={17} strokeWidth={2.4} />
        </Badge>
      </IsoAt>
      <IsoAt x={OFFICE.x + DOOR.b + 0.3} y={OFFICE.y + OFFICE.d} z={1.75} cy>
        <Badge on={read} ring={SG_TONE} size={32} style={{ color: SG_TONE }}>
          <KeyRound size={17} strokeWidth={2.4} />
        </Badge>
      </IsoAt>

      {/* the TR's tags, each on the thing it names, a short leader to it */}
      <div style={{ opacity: opSg, transition: fadeT }}>
        <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
          <path d={`M ${DOOR_TAG.x + 112} ${DOOR_TAG.y + 14} L ${door[0] - 6} ${door[1]}`} fill="none" stroke={sg ? SG_TONE : '#9FB3D1'} strokeWidth={1.2} strokeDasharray="3 4" style={{ transition: fadeT }} />
          <path d={`M ${READER_TAG.x + 40} ${READER_TAG.y + 28} L ${reader[0] + 3} ${reader[1] - 8}`} fill="none" stroke={sg ? SG_TONE : '#9FB3D1'} strokeWidth={1.2} strokeDasharray="3 4" style={{ transition: fadeT }} />
        </svg>
        <At x={DOOR_TAG.x} y={DOOR_TAG.y}>
          <Label size={14} strong style={lit(sg, SG_TONE)} raised>
            Two-Way Door
          </Label>
        </At>
        <At x={READER_TAG.x} y={READER_TAG.y}>
          <Label size={14} strong style={lit(sg, SG_TONE)} raised>
            Electronic Access System
          </Label>
        </At>
      </div>
      <div style={{ opacity: opAcl, transition: fadeT }}>
        <IsoAt x={BOOTH.x + BOOTH.w} y={BOOTH.y + BOOTH.d / 2} dx={44} dy={-2} cx={false}>
          <Label size={14} strong style={lit(acl, ACL_TONE)} raised>
            Security Checkpoint
          </Label>
        </IsoAt>
        <At x={14} y={ENTRY_TAG_Y}>
          <Label size={14} strong style={lit(acl, ACL_TONE)} raised>
            Entrance and Exit of a Campus
          </Label>
        </At>
      </div>
    </IsoScene>
  )
}

/* where the tags sit (scene px), and the points their leaders reach */
const DOOR_TAG = { x: 64, y: 126 } as const
const READER_TAG = { x: 262, y: 96 } as const
const ENTRY_TAG_Y = 318

/* ------------------------------------------------------------------ the concept picture */

/* the subnet (the campus), its edge (the fence) with the ACL in the gap (the checkpoint), the instance in its group (the office and its door) */
const C = {
  sub: { x: 34, y: 24, w: 402, h: 270 },
  gate: { x: 196, w: 78 },
  inst: { cx: 235, cy: 124, size: 72 },
  ring: { x: 171, y: 60, w: 128, h: 128 },
  lane: 235,
  globe: { cx: 235, cy: 350, w: 62 },
} as const
const C_STOP = { out: 334, gate: 250, door: C.ring.y + C.ring.h + 14 } as const
const cY = (k: number) => (k === 1 || k === 3 ? C_STOP.gate : k === 2 ? C_STOP.door : C_STOP.out)

function SubnetScene({ k }: { k: number }) {
  const instant = useInstant()
  const focus = focusOf(k)
  const acl = focus === 'acl'
  const sg = focus === 'sg'
  const opAcl = focus === 'sg' ? FADE : 1
  const opSg = focus === 'acl' ? FADE : 1
  const fadeT = instant ? 'none' : `opacity 460ms ${EASE}`
  const ease = instant ? 'none' : `all 460ms ${EASE}`
  const gateY = C.sub.y + C.sub.h
  /* the packet: in toward the instance (the request), back out (its reply) */
  const out = k === 3 || k === 4
  const py = cY(k)
  const tone = out ? colors.success : colors.accent
  const walkT = instant ? 'none' : `transform 1500ms ${WALK} 450ms, background 300ms ${EASE}, box-shadow 300ms ${EASE}`
  const ringOpen = sg
  return (
    <>
      {/* the outside: where the request comes from and the reply goes back to */}
      <div className="absolute" style={{ left: C.globe.cx - C.globe.w / 2, top: C.globe.cy - C.globe.w / 2 + 2, opacity: opAcl === 1 ? 1 : 0.6, transition: fadeT }}>
        <CvIcon name="globe-www" w={C.globe.w} />
      </div>
      {/* the lane the packet walks */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
        <line x1={C.lane} y1={C.globe.cy - C.globe.w / 2} x2={C.lane} y2={C.ring.y + C.ring.h + 2} stroke="#B7C7E6" strokeWidth={1.25} strokeDasharray="4 6" />
      </svg>
      {/* the subnet's edge: the ACL's whole boundary, teal, with the gap the ACL guards */}
      <div className="absolute" style={{ left: C.sub.x, top: C.sub.y, width: C.sub.w, height: C.sub.h, borderRadius: 18, background: `linear-gradient(180deg, ${ACL_TONE}0A 0%, ${ACL_TONE}1A 100%)`, boxShadow: `inset 0 0 0 2.5px ${ACL_TONE}`, opacity: opAcl, transition: ease }}>
      </div>
      {/* two neighbour instances, each with its own group, faint: the subnet holds more than one */}
      {[86, 384].map((x) => (
        <div key={x} className="absolute grid place-items-center" style={{ left: x - 30, top: C.inst.cy - 30, width: 60, height: 60, borderRadius: 14, boxShadow: `inset 0 0 0 2px ${SG_TONE}55`, opacity: focus === 'none' ? 0.7 : 0.35, transition: fadeT }}>
          <span className="grid place-items-center rounded-[11px]" style={{ width: 40, height: 40, background: colors.white, color: colors.brandDark, boxShadow: '0 6px 14px -8px rgba(16,32,58,0.5)' }}>
            <ServerGlyph size={20} />
          </span>
        </div>
      ))}
      {/* the network ACL: a gate in the subnet's edge, sliding open while the packet is checked */}
      <div className="absolute" style={{ left: C.gate.x - 6, top: gateY - 9, width: C.gate.w + 12, height: 18, borderRadius: 9, background: colors.white, opacity: opAcl, transition: fadeT }} />
      <div className="absolute overflow-hidden" style={{ left: C.gate.x, top: gateY - 7, width: C.gate.w, height: 14, opacity: opAcl, transition: fadeT }}>
        <span className="absolute inset-y-0 left-0 rounded-l-[7px]" style={{ width: C.gate.w / 2, background: `repeating-linear-gradient(90deg, ${ACL_TONE} 0 8px, ${shade(ACL_TONE, 0.55)} 8px 12px)`, transform: acl ? `translateX(${-C.gate.w / 2 + 6}px)` : 'none', transition: instant ? 'none' : `transform 460ms ${EASE}` }} />
        <span className="absolute inset-y-0 right-0 rounded-r-[7px]" style={{ width: C.gate.w / 2, background: `repeating-linear-gradient(90deg, ${shade(ACL_TONE, 0.55)} 0 4px, ${ACL_TONE} 4px 12px)`, transform: acl ? `translateX(${C.gate.w / 2 - 6}px)` : 'none', transition: instant ? 'none' : `transform 460ms ${EASE}` }} />
      </div>
      {[C.gate.x - 6, C.gate.x + C.gate.w + 6].map((x) => (
        <span key={x} aria-hidden className="absolute rounded-full" style={{ left: x - 7, top: gateY - 7, width: 14, height: 14, background: shade(ACL_TONE, -0.2), boxShadow: `0 0 0 2.5px ${colors.white}`, opacity: opAcl, transition: fadeT }} />
      ))}
      <div className="absolute" style={{ left: C.gate.x + C.gate.w + 20, top: gateY - 22, transform: 'translateY(-50%)' }}>
        <Badge on={acl} ring={ACL_TONE} size={32} style={{ color: shade(ACL_TONE, -0.25) }}>
          <ScanSearch size={17} strokeWidth={2.4} />
        </Badge>
      </div>
      {/* the instance and its security group: a blue ring with a door on the side the packet comes from */}
      <div className="absolute" style={{ left: C.ring.x, top: C.ring.y, width: C.ring.w, height: C.ring.h, borderRadius: 22, background: `${SG_TONE}12`, boxShadow: sg ? `inset 0 0 0 3px ${SG_TONE}, 0 0 0 5px ${SG_TONE}26` : `inset 0 0 0 3px ${SG_TONE}`, opacity: opSg, transition: ease }} />
      <div className="absolute" style={{ left: C.inst.cx - 15, top: C.ring.y + C.ring.h - 5, width: 30, height: 10, opacity: opSg, transition: fadeT }}>
        <span className="absolute inset-y-0 left-0 rounded-[3px]" style={{ width: 15, background: '#BFD6FF', boxShadow: `inset 0 0 0 1.5px ${SG_TONE}`, transform: ringOpen ? 'translateX(-12px)' : 'none', transition: instant ? 'none' : `transform 460ms ${EASE}` }} />
        <span className="absolute inset-y-0 right-0 rounded-[3px]" style={{ width: 15, background: '#BFD6FF', boxShadow: `inset 0 0 0 1.5px ${SG_TONE}`, transform: ringOpen ? 'translateX(12px)' : 'none', transition: instant ? 'none' : `transform 460ms ${EASE}` }} />
      </div>
      <div className="absolute grid place-items-center rounded-[16px]" style={{ left: C.inst.cx - C.inst.size / 2, top: C.inst.cy - C.inst.size / 2, width: C.inst.size, height: C.inst.size, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', color: colors.brandDark, boxShadow: '0 10px 20px -12px rgba(16,32,58,0.55), inset 0 0 0 1.5px #C3D3F0', opacity: opSg === 1 ? 1 : 0.5, transition: fadeT }}>
        <ServerGlyph size={32} />
      </div>
      <div className="absolute" style={{ left: C.ring.x + C.ring.w + 12, top: C.ring.y + C.ring.h - 30 }}>
        <Badge on={k === 2} ring={SG_TONE} size={32} style={{ color: SG_TONE }}>
          <ShieldCheck size={17} strokeWidth={2.4} />
        </Badge>
      </div>
      {/* the packet */}
      <span aria-hidden className="absolute rounded-full" style={{ left: C.lane - 9, top: -9, width: 18, height: 18, background: tone, boxShadow: `0 0 0 4px ${tone}40, 0 0 0 2px ${colors.white} inset`, transform: `translateY(${py}px)`, transition: walkT }} />

      {/* the TR's tags */}
      <div className="absolute" style={{ left: C.ring.x + C.ring.w - 18, top: C.ring.y - 13, opacity: opSg, transition: fadeT }}>
        <Label size={14} strong raised style={sg ? { background: SG_TONE, color: colors.white, boxShadow: `inset 0 0 0 1.5px ${SG_TONE}` } : { color: colors.brandDark, boxShadow: `inset 0 0 0 1.5px ${SG_TONE}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
          Security Group
        </Label>
      </div>
      <div className="absolute" style={{ left: C.gate.x - 132, top: gateY - 34, opacity: opAcl, transition: fadeT }}>
        <Label size={14} strong raised style={acl ? { background: ACL_TONE, color: colors.white, boxShadow: `inset 0 0 0 1.5px ${ACL_TONE}` } : { color: colors.tealDark, boxShadow: `inset 0 0 0 1.5px ${ACL_TONE}, 0 8px 16px -10px rgba(16,32,58,0.35)` }}>
          Network ACL
        </Label>
      </div>
    </>
  )
}

/** The server glyph of `Resource`, drawn here so the tile can be styled freely. */
function ServerGlyph({ size }: { size: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <path d="M6 6h.01M6 18h.01" />
    </svg>
  )
}

/**
 * The one clock (one step track) both pictures read. Auto animation OFF (and on harness URLs): the whole
 * picture, then one press per part. Auto ON (R8.1, loops restart at once): the four parts only, round and round,
 * with no resting whole-picture beat between laps; that clock registers no presses.
 */
function useWalk() {
  const instant = useInstant()
  const auto = useAutoAnim()
  const stepped = useCycle(5, 2600, 0, 4)
  const lap = useCycle(4, 2600, 3, 0)
  return STILL || REDUCED || instant || !auto ? stepped : lap + 1
}

export function DoorCheckpointAnalogy({ lesson }: { lesson: string }) {
  const k = useWalk()
  return (
    <IsoAnalogy
      id="T19-AN"
      kicker="Network Security Layers"
      title="A Two-Way Access Door, and a Campus Checkpoint"
      lesson={lesson}
      bare
      h={AH}
      everyday={{ label: 'A Two-Way Access Door, and a Campus Checkpoint', scene: <CampusScene k={k} /> }}
      cloud={{ label: 'A security group, and a network ACL', scene: <SubnetScene k={k} /> }}
    />
  )
}

