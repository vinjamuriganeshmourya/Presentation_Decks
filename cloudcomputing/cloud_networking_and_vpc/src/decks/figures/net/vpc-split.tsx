import type { ReactNode } from 'react'
import { Boxes, Cloud, Hash, MapPin, Network, Split } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, Fade, Label, useBuild } from '../scene'
import { Icon3D, LAB } from '../d3/kit'
import { AwsMark, LitFigure } from './fx'
import { Logo, NET, Resource, SubnetBox } from './frames'
import { Flow } from './vpc-society'
import { EASE, Frame, Line, Status, useHeld } from './vpc-kit'

/**
 * T06-1 · FROM ONE VPC TO ITS SUBNETS, SPLIT IN TWO (round 2, FS review
 * 2026-11-04: "split into two slides; arrows 1pt thinner, heads exactly on their
 * boxes; no subnet icon over the Availability Zone boxes; centred with padding;
 * no animation on the AWS, Azure and Google Cloud logos").
 *
 *   T06-1   the lead and points 1-2: the VPC with its address range as one bar;
 *           the bar splits into four blocks and 1.5px arrows carry each block to
 *           its subnet (heads ending on the subnets' top edges); the shared
 *           switches and cables, the other tenants' traffic on the cable, the
 *           VPC's own on its own dashed lane
 *   T06-1b  points 3-4: the same VPC (range already split, its arrows already
 *           drawn); the three names beside it, logos still; then the subnets
 *           grouped into two Availability Zones (borderless tints, the zone chip
 *           under its subnets so no arrow crosses a chip) and the one large CIDR
 *           block named on the VPC
 * Every string is the card's; the second slide repeats the figure's own labels.
 */

const LEAD = 'A VPC provides an isolated network with its own address range'
const POINTS_A = [
  { icon: <Split size={20} />, text: 'This range is divided into smaller subnets to organize and place resources' },
  { icon: <Network size={20} />, text: "Logical isolation separates each customer's traffic in software, even while sharing physical switches and cables" },
]
/** T06-1b's two point boxes at one height (user, 2026-11-05: point 2 wraps to exactly three lines and both boxes match): each text sits in a three-line block, centred. */
const threeLines = (t: string) => (
  <span className="flex flex-col justify-center" style={{ minHeight: '4.125em' }}>
    {t}
  </span>
)
const POINTS_B = [
  { icon: <Cloud size={20} />, text: threeLines('The same boundary concept appears as AWS VPC, Azure VNet and GCP VPC Network with minor differences') },
  { icon: <Boxes size={20} />, text: threeLines('That one large CIDR block must now be split into smaller subnets placed across Availability Zones (in AWS, each subnet sits in one AZ)') },
]

const POINTS_W = 576
const W = 1110 - POINTS_W - 24
const H = 312
const ARROW_W = 1.5
const BAR_X = 14
const BAR_H = 12

/** The four blocks of a range bar of width `w`: one per subnet, a gap opening between them when split. */
function blocks(w: number, split: boolean) {
  const gap = split ? 8 : 0
  const bw = (w - gap * 3) / 4
  return [0, 1, 2, 3].map((i) => ({ x: i * (bw + gap), w: bw }))
}

/** The VPC's address range as one bar that splits into four blocks. */
function RangeBar({ w, split, lit }: { w: number; split: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <>
      {blocks(w, split).map((b, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute"
          style={{
            left: BAR_X + b.x,
            top: 0,
            width: b.w,
            height: BAR_H,
            borderRadius: split ? 6 : i === 0 ? '6px 0 0 6px' : i === 3 ? '0 6px 6px 0' : 0,
            background: lit ? colors.brandDark : NET.boundary,
            opacity: 0.85,
            transition: instant ? 'none' : `left 560ms ${EASE}, width 560ms ${EASE}, background 420ms ${EASE}, border-radius 420ms ${EASE}`,
          }}
        />
      ))}
    </>
  )
}

/** The VPC box: its label and address range chip inside, the range bar at `barY`, anything else as children. */
function VpcBox({ w, h, split, litBar, lit, barY, children }: { w: number; h: number; split: boolean; litBar: boolean; lit: boolean; barY: number; children?: ReactNode }) {
  return (
    <Frame
      w={w}
      h={h}
      dashed
      label="VPC"
      lit={lit}
      extra={
        <Label size={14} strong tone="brand" icon={<MapPin />}>
          Address Range
        </Label>
      }
    >
      <div className="absolute" style={{ left: 0, top: barY, width: w, height: BAR_H }}>
        <RangeBar w={w - BAR_X * 2 - 3} split={split} lit={litBar} />
      </div>
      {children}
    </Frame>
  )
}

/** A subnet: its chip top-left, its resource centred below it with its light on. */
function Subnet({ w, h, lit, light, delay = 0 }: { w: number; h: number; lit: boolean; light: boolean; delay?: number }) {
  return (
    <SubnetBox w={w} h={h} label="Subnet" lit={lit}>
      <div className="absolute" style={{ left: '50%', bottom: 8, transform: 'translateX(-50%)' }}>
        <span className="relative block">
          <Resource size={28} />
          {light && <Status x={26} y={2} delay={delay} />}
        </span>
      </div>
    </SubnetBox>
  )
}

/* ================================================================== T06-1 */

const A_VPC = { x: (W - 320) / 2, y: 12, w: 320, h: 88, barY: 48 }
const A_SUB = { w: 108, h: 70, y: 138, gap: 12 }
const A_SUB_X0 = (W - (A_SUB.w * 4 + A_SUB.gap * 3)) / 2
const A_ROUTER = { w: 52, xs: [22, W - 22 - 52], y: 228 }
const A_CABLE_Y = 254

function SplitScene({ k, held }: { k: number; held: boolean }) {
  const now = (i: number) => !held && k === i
  const split = k >= 1
  const bw = A_VPC.w - BAR_X * 2 - 3
  const from = blocks(bw, true).map((b) => A_VPC.x + 1.5 + BAR_X + b.x + b.w / 2)
  const subX = (i: number) => A_SUB_X0 + i * (A_SUB.w + A_SUB.gap)
  const cableL = A_ROUTER.xs[0] + A_ROUTER.w + 4
  const cableR = A_ROUTER.xs[1] - 4
  const laneY = A_CABLE_Y - 10
  return (
    <>
      <At x={A_VPC.x} y={A_VPC.y}>
        <VpcBox w={A_VPC.w} h={A_VPC.h} split={split} litBar={now(1)} lit={now(0)} barY={A_VPC.barY} />
      </At>
      {/* the split: each block of the range carried down to its subnet, the head ending on the subnet's top edge */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <Arrow x1={from[i]} y1={A_VPC.y + A_VPC.h + 2} x2={subX(i) + A_SUB.w / 2} y2={A_SUB.y} on={k >= 1} delay={i * 90} width={ARROW_W} tone={now(1) ? colors.brandDark : NET.boundary} />
          <At x={subX(i)} y={A_SUB.y}>
            <Fade on={k >= 1} lift={8} delay={240 + i * 90}>
              <Subnet w={A_SUB.w} h={A_SUB.h} lit={false} light={k >= 1} delay={i * 0.35} />
            </Fade>
          </At>
        </div>
      ))}
      {/* the shared switches and cables, the VPC's own lane over the shared cable */}
      <Fade on={k >= 2} lift={0}>
        <Line x={cableL} y={A_CABLE_Y} len={cableR - cableL} tone={LAB.lavDeep} thick={6} />
        <span aria-hidden className="absolute" style={{ left: cableL + 8, top: laneY - 0.75, width: cableR - cableL - 16, height: 0, borderTop: `1.5px dashed ${now(2) ? colors.brandDark : colors.brand}` }} />
        {A_ROUTER.xs.map((x) => (
          <At key={x} x={x} y={A_ROUTER.y}>
            <Icon3D name="router" w={A_ROUTER.w} />
          </At>
        ))}
        <At x={W / 2} y={A_CABLE_Y + 16} cx>
          <Label strong tone={now(2) ? 'solid' : 'plain'} raised icon={<Network />}>
            Shared Physical Switches and Cables
          </Label>
        </At>
      </Fade>
      {k >= 2 && !held && (
        <>
          <Flow x1={cableL + 8} y1={A_CABLE_Y} x2={cableR - 8} y2={A_CABLE_Y} tone={colors.muted} n={3} dur={2.8} size={11} />
          <Flow x1={cableR - 12} y1={laneY} x2={cableL + 12} y2={laneY} tone={colors.brand} n={2} dur={2.4} size={10} />
        </>
      )}
    </>
  )
}

export function VpcToSubnets({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(3, 1100)
  const lit = held ? -1 : k - 1
  return <LitFigure id="T06-1" kicker="From VPC To Subnets" title="What Comes Next" lead={LEAD} lesson={lesson} points={POINTS_A} lit={lit} figure={<SplitScene k={k} held={held} />} figH={H} pointsW={POINTS_W} />
}

/* ================================================================== T06-1b */

const B_VPC = { x: 16, y: 12, w: 240, h: 108, barY: 46 }
const B_NAMES = { x: B_VPC.x + B_VPC.w + 16, ys: [22, 54, 86] }
const B_ZONE = { y: 152, w: (W - 32 - 14) / 2, xs: [16, 16 + (W - 32 - 14) / 2 + 14] }
const B_SUB = { w: 0, h: 70, pad: 10, gap: 10 }
B_SUB.w = (B_ZONE.w - B_SUB.pad * 2 - B_SUB.gap) / 2
const B_SUB_Y = B_ZONE.y + B_SUB.pad
const B_ZONE_H = B_SUB.pad + B_SUB.h + 10 + 26 + 10
const NAMES: { name: 'aws' | 'azure' | 'gcp'; text: string }[] = [
  /* the marks carry the provider's name, so the label is the network's name alone (user, 2026-11-05, global rule 2) */
  { name: 'aws', text: 'VPC' },
  { name: 'azure', text: 'VNet' },
  { name: 'gcp', text: 'VPC Network' },
]

function ZonesScene({ k, held }: { k: number; held: boolean }) {
  const instant = useInstant()
  const now = (i: number) => !held && k === i
  const bw = B_VPC.w - BAR_X * 2 - 3
  const from = blocks(bw, true).map((b) => B_VPC.x + 1.5 + BAR_X + b.x + b.w / 2)
  const subX = (i: number) => B_ZONE.xs[i < 2 ? 0 : 1] + B_SUB.pad + (i % 2) * (B_SUB.w + B_SUB.gap)
  return (
    <>
      <At x={B_VPC.x} y={B_VPC.y}>
        <VpcBox w={B_VPC.w} h={B_VPC.h} split litBar={false} lit={now(2)} barY={B_VPC.barY}>
          <div className="absolute" style={{ left: 10, bottom: 8 }}>
            <Fade on={k >= 2} lift={6}>
              <Label strong tone={now(2) ? 'solid' : 'brand'} raised icon={<Hash />}>
                One Large CIDR Block
              </Label>
            </Fade>
          </div>
        </VpcBox>
      </At>
      {/* the three names beside the VPC, each with its provider's mark (logos never move) */}
      {NAMES.map((n, i) => (
        <At key={n.name} x={B_NAMES.x} y={B_NAMES.ys[i]}>
          <Fade on={k >= 1} lift={6} delay={i * 140}>
            <span className="inline-flex items-center gap-2 whitespace-nowrap font-heading text-[15px] font-semibold leading-none" style={{ color: now(1) ? colors.brand : colors.ink, transition: instant ? 'none' : `color 420ms ${EASE}` }}>
              {/* each mark at its own aspect ratio: one dimension set, in a column wide enough for the widest (Google Cloud) */}
              <span className="inline-flex w-[80px] shrink-0 justify-center">{n.name === 'aws' ? <AwsMark w={30} /> : <Logo name={n.name} h={n.name === 'gcp' ? 12 : 16} />}</span>
              {n.text}
            </span>
          </Fade>
        </At>
      ))}
      {/* the two Availability Zones: borderless tints, the zone chip under its subnets */}
      {B_ZONE.xs.map((x, i) => (
        <At key={i} x={x} y={B_ZONE.y}>
          <Fade on={k >= 2} lift={0} delay={i * 120}>
            <div className="relative rounded-[14px]" style={{ width: B_ZONE.w, height: B_ZONE_H, background: now(2) ? 'rgba(45,99,251,0.14)' : 'rgba(45,99,251,0.07)', boxShadow: now(2) ? `inset 0 0 0 1.5px ${colors.brand}` : 'none', transition: instant ? 'none' : `background 420ms ${EASE}, box-shadow 420ms ${EASE}` }}>
              <div className="absolute" style={{ left: B_SUB.pad, bottom: 10 }}>
                <Label strong tone={now(2) ? 'solid' : 'brand'} icon={<Boxes />}>
                  Availability Zone
                </Label>
              </div>
            </div>
          </Fade>
        </At>
      ))}
      {/* the split, already made: each block carried to its subnet */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <Arrow x1={from[i]} y1={B_VPC.y + B_VPC.h + 2} x2={subX(i) + B_SUB.w / 2} y2={B_SUB_Y} width={ARROW_W} tone={NET.boundary} />
          <At x={subX(i)} y={B_SUB_Y}>
            <Subnet w={B_SUB.w} h={B_SUB.h} lit={false} light delay={i * 0.35} />
          </At>
        </div>
      ))}
    </>
  )
}

/** The split's second half (T06-1b, round 2): points 3-4, the names and the zones. */
export function VpcToSubnets2({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(3, 1100)
  const lit = held ? -1 : k - 1
  return <LitFigure id="T06-1b" kicker="From VPC To Subnets" title="What Comes Next" lesson={lesson} points={POINTS_B} lit={lit} figure={<ZonesScene k={k} held={held} />} figH={B_ZONE.y + B_ZONE_H + 14} pointsW={POINTS_W} />
}
