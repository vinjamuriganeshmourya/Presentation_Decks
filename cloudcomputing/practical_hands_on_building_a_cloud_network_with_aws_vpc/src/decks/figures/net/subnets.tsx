import { Fragment, type ReactNode } from 'react'
import { Building2, Cloud, Globe, Lock, MapPin, Ruler, Scale, Scissors } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Fade, Label, Stage, useBuild } from '../scene'
import { Badge, LitFigure, LitPoints, Ripple, type CvIconName } from './fx'
import { Gateway, NET, SubnetBox } from './frames'
import { Cidr, Disc, EASE, Host, IconText, onRim, Packet, SB_CSS, ThinBoundary } from './subnets-parts'
import { SIZING_CSS } from './subnets-sizing'
import { SPLIT_CSS } from './subnets-split'
import { ZONES_CSS } from './subnets-zones'

/**
 * SECTION 3 · SUBNETS & IP ADDRESSING (T07-1 to T11-1), visual pass 2026-11-04
 * in Session 4's design: every point list is `LitFigure` (each point with its
 * subject icon, the point the figure is acting out lit), every table is
 * `VisualTable` (header, row and cell icons, rows built one by one), every
 * resource is a library render on a tile (a server stack in a public subnet, a
 * database in a private one). No string changed; icons carry no captions.
 *
 * Every state change is a `useBuild` called by the slide (auto animation OFF:
 * one state per press), so the lit point and the picture move together:
 *   T07-1   the TR image's two slices cut by the scissors, one slice widened, the split into
 *           Public and Private with the gateway lines (packets riding them)        this file
 *   T07-1b  the zones outlined under their headers, then each subnet's hosts by its size
 *   T08-1   the /24 grid labelled, its five reserved squares shaded and zoomed (each with
 *           its function's icon), the 251 usable filled, the first host given an address
 *   T08-1b  the /28 beside it and zoomed, its 11 usable fill and a 12th host is turned away,
 *           then the lock closes on the /24 label                                  subnets-sizing.tsx
 *   T09-1   the table, row by row
 *   T09-2   each subnet's 251, the four gathered into 1004, the 65,536 and the share used
 *   T10-1   the table row by row, the drawing following the same press             subnets-split.tsx
 *   T11-1   the two zones as places, their subnet pairs, the console's labels
 *   T11-1b  traffic into both zones, one zone loses power and its links break, the other
 *           zone carries all the traffic                                            subnets-zones.tsx
 * On harness URLs every build holds its most complete state.
 */

/* ===== T07-1 · Subnets: size, type, zone */

const T07_POINTS: ReactNode[] = [
  'A larger slice kept for a subnet means fewer subnets can be carved from the same VPC block',
  'Public subnets have a route to an internet gateway; private subnets do not',
  'Every subnet is created inside exactly one availability zone, a physically separate data centre',
  'Subnet type and size together decide how many resources a zone can host and how exposed they are',
]
const T07_ICONS: ReactNode[] = [<Ruler key="0" size={20} />, <Globe key="1" size={20} />, <Building2 key="2" size={20} />, <Scale key="3" size={20} />]

/* the stage, 546 x 350 (a three-line lead above it), 14px clear on every side; the VPC block's inner row is 436 wide plus the 14 gap.
   `s7(w)` lays the same drawing out on a wider stage (T07-1b, 2026-11-05): the region, the VPC and the two columns widen, every
   height and every piece's size stays, the two slices keep their 218 : 262 proportion */
const S7_H = 350
const S7_W = 546
function s7(w = S7_W) {
  const innerW = w - 96
  const equal = (innerW - 14) / 2
  return {
    reg: { x: 14, y: 30, w: w - 28, h: 304 },
    vpc: { x: 34, y: 100, w: w - 68, h: 210 },
    igw: { cx: w / 2, cy: 100, r: 22 },
    headY: 132,
    zoneTop: 144,
    rowTop: 164,
    rowH: 58,
    rowGap: 8,
    innerX: 48,
    innerW,
    colGap: 14,
    /** the image's two /25 slices, equal; then one slice widened */
    equal,
    wide: Math.round((equal * 262) / 218),
  }
}
/** the points column, wide enough that every point holds to two lines (FS review: max two lines); the stage is 546 */
const T07_POINTS_W = 540

/** A public host's exposure: a globe disc on its corner. */
function ExposedBadge({ on }: { on: boolean }) {
  return (
    <Badge on={on} size={20} ring={NET.public}>
      <Globe size={11} strokeWidth={2.8} color={NET.public} />
    </Badge>
  )
}

/** The private subnet's lock: a small padlock disc on each host's corner. */
function PadBadge({ on }: { on: boolean }) {
  return (
    <Badge on={on} size={20} ring={NET.private}>
      <Lock size={11} strokeWidth={2.8} color={NET.private} />
    </Badge>
  )
}

/**
 * THE SUBNETS PICTURE, one build across T07-1 and T07-1b (`k`, 0 to 4):
 *   0  the TR image: the /24 block cut into two /25 slices, the scissors on the cut
 *   1  one slice widened (the cut slides over, the other slice is left narrower), numbers gone
 *   2  the split: Public on top with a line to the internet gateway (packets riding it),
 *      Private below with a lock and no line
 *   3  the two Availability Zones outlined (a thin line on a tint) under their headers
 *   4  the wide column's subnets hold four hosts, the narrow's two; public hosts show a globe (exposed)
 */
function SubnetsScene({ k, w = S7_W, centred = false }: { k: number; w?: number; centred?: boolean }) {
  const S7 = s7(w)
  const instant = useInstant()
  const move = instant ? 'none' : `left 620ms ${EASE}, width 620ms ${EASE}`
  const widthT = instant ? 'none' : `width 620ms ${EASE}`
  const wide = k >= 1
  const split = k >= 2
  const zones = k >= 3
  const sized = k >= 4
  const wA = wide ? S7.wide : S7.equal
  const wB = S7.innerW - S7.colGap - wA
  const cols = [
    { x: S7.innerX, w: wA, cidr: '10.0.0.0/25' },
    { x: S7.innerX + wA + S7.colGap, w: wB, cidr: '10.0.0.128/25' },
  ]
  const fullH = S7.rowH * 2 + S7.rowGap
  const cutX = S7.innerX + wA + S7.colGap / 2
  /* the gateway lines: from each Public box's top edge (the inner part, clear of the zone header) to the disc's rim */
  const lines = cols.map((c, i) => {
    const x1 = i === 0 ? c.x + c.w * 0.78 : c.x + c.w * 0.16
    return { x1, y1: S7.rowTop, ...onRim(x1, S7.rowTop, S7.igw) }
  })
  /* hosts per subnet (FS review: no subnet looks empty): two in every subnet once split; when sizes are compared the
     wide column's grow to four, and every public host shows it is exposed (a globe), every private one locked */
  const hostRow = (i: number, icon: CvIconName, kind: 'public' | 'private') => (
    <div className="flex items-center gap-2.5">
      {[0, 1, 2, 3].map((h) => {
        const on = h < 2 || (sized && i === 0)
        /* a host not yet placed takes no room, so the row grows leftward from the box's right edge */
        return (
          <span key={h} style={{ display: on ? 'block' : 'none' }}>
            <Host icon={icon} size={34} on={on} delay={h * 160} badge={kind === 'private' ? <PadBadge on={split} /> : <ExposedBadge on={sized} />} />
          </span>
        )
      })}
    </div>
  )
  return (
    <>
      <At x={S7.reg.x} y={S7.reg.y}>
        <ThinBoundary dashed w={S7.reg.w} h={S7.reg.h} label={<IconText icon={<MapPin size={13} strokeWidth={2.4} />}>Region</IconText>} />
      </At>
      <At x={S7.vpc.x} y={S7.vpc.y}>
        <ThinBoundary w={S7.vpc.w} h={S7.vpc.h} label={<IconText icon={<Cloud size={13} strokeWidth={2.4} />}>VPC</IconText>} />
      </At>
      {/* the image's own CIDR on the VPC, on its top-right edge: only while the block is the image's two slices */}
      <At x={S7.vpc.x + S7.vpc.w - 14} y={S7.vpc.y} style={{ transform: 'translate(-100%, -50%)' }}>
        <Fade on={!wide} lift={0}>
          <Cidr tone="brand" raised strong>
            10.0.0.0/24
          </Cidr>
        </Fade>
      </At>
      {/* the two Availability Zones, outlined around their columns */}
      {cols.map((c, i) => (
        <At key={`z${i}`} x={c.x - 5} y={S7.zoneTop} style={{ transition: move }}>
          <Fade on={zones} lift={0}>
            <div className="rounded-[14px]" style={{ width: c.w + 10, height: S7.rowTop + fullH + 7 - S7.zoneTop, border: `1.5px solid ${colors.brand}55`, background: `${colors.brand}0D`, transition: widthT }} />
          </Fade>
        </At>
      ))}
      {/* the internet gateway on the VPC's top edge, its signal rippling once it has routes */}
      <At x={S7.igw.cx} y={S7.igw.cy - 42} cx cy>
        <Fade on={split}>
          <Label size={14} strong raised>
            Internet Gateway
          </Label>
        </Fade>
      </At>
      <Ripple x={S7.igw.cx} y={S7.igw.cy} r={S7.igw.r} tone={NET.public} on={split} />
      <At x={S7.igw.cx} y={S7.igw.cy} cx cy>
        <Fade on={split} lift={0}>
          <Gateway kind="igw" size={S7.igw.r * 2} />
        </Fade>
      </At>
      {cols.map((c, i) => (
        <Fragment key={i}>
          {/* the zone header over its column: at the outer corner, so the gateway line has the inner lane */}
          <At x={i === 0 ? c.x + 4 : c.x + c.w - 4} y={S7.headY} style={{ transition: move, transform: i === 1 ? 'translateX(-100%)' : undefined }}>
            <Fade on={zones}>
              <Label size={14} strong tone="brand" raised>
                Availability Zone
              </Label>
            </Fade>
          </At>
          {/* the image's slice: one box the full height, a host in it, its CIDR at its foot */}
          <At x={c.x} y={S7.rowTop} style={{ transition: move }}>
            <Fade on={!split} lift={0}>
              <SubnetBox w={c.w} h={fullH} style={{ transition: widthT }} label={i === 0 ? 'Subnet A' : 'Subnet B'}>
                <At x={c.w / 2} y={fullH / 2 - 8} cx cy style={{ transition: move }}>
                  <Host icon="server-stack" size={42} />
                </At>
                <At x={c.w / 2} y={fullH - 20} cx cy style={{ transition: move }}>
                  <Fade on={!wide} lift={0}>
                    <Cidr>{c.cidr}</Cidr>
                  </Fade>
                </At>
              </SubnetBox>
            </Fade>
          </At>
          {/* the split: Public on the top row, Private on the bottom, the width the slice kept */}
          <At x={c.x} y={S7.rowTop} style={{ transition: move }}>
            <Fade on={split} lift={0} delay={split ? 240 : 0}>
              <SubnetBox w={c.w} h={S7.rowH} kind="public" label="Public" style={{ transition: widthT }}>
                <At x={centred ? c.w / 2 : c.w - 14} y={S7.rowH / 2 + 2} style={{ transform: centred ? 'translate(-50%, -50%)' : 'translate(-100%, -50%)' }}>
                  {hostRow(i, 'server-stack', 'public')}
                </At>
              </SubnetBox>
            </Fade>
          </At>
          <At x={c.x} y={S7.rowTop + S7.rowH + S7.rowGap} style={{ transition: move }}>
            <Fade on={split} lift={0} delay={split ? 360 : 0}>
              <SubnetBox w={c.w} h={S7.rowH} kind="private" label="Private" style={{ transition: widthT }}>
                <At x={centred ? c.w / 2 : c.w - 14} y={S7.rowH / 2 + 2} style={{ transform: centred ? 'translate(-50%, -50%)' : 'translate(-100%, -50%)' }}>
                  {hostRow(i, 'database', 'private')}
                </At>
              </SubnetBox>
            </Fade>
          </At>
        </Fragment>
      ))}
      {/* the cut between the two slices: the scissors ride it as one slice widens, inside the VPC above the cut (clear of every border) */}
      <At x={cutX} y={(S7.vpc.y + S7.rowTop) / 2} cx cy style={{ transition: instant ? 'none' : `left 620ms ${EASE}`, zIndex: 4 }}>
        <Fade on={!split} lift={0}>
          <Disc size={32} tone={colors.brand}>
            <span className="sb-snip grid place-items-center" style={{ transform: 'rotate(-90deg)' }}>
              <Scissors size={17} strokeWidth={2.4} />
            </span>
          </Disc>
        </Fade>
      </At>
      {/* the gateway lines, only on the two Public subnets (must), packets riding them out to the gateway */}
      {lines.map((l, i) => (
        <Fragment key={`l${i}`}>
          <Arrow x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} on={split} tone={NET.public} delay={i * 160} />
          <Packet x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} on={split} tone={NET.public} delay={1.1 + i * 0.5} dur={1.6} />
        </Fragment>
      ))}
    </>
  )
}

/** T07-1, split in two (user, 2026-10-30, G6): the lead and the sizing and type points with the slices; then the zone points. */
export function SubnetsOverview({ lesson }: { lesson: string }) {
  const k = useBuild(3, 1300, 1400)
  return (
    <LitFigure
      id="T07-1"
      kicker="Subnets Overview"
      title="CIDR Type Zone"
      lead="A virtual private cloud's address block is split into subnets, smaller ranges sized using CIDR (Classless Inter-Domain Routing) notation, so that different resources can sit in different zones with different internet access rules"
      lesson={lesson}
      points={T07_POINTS.slice(0, 2).map((text, i) => ({ icon: T07_ICONS[i], text }))}
      lit={k - 1}
      pointSize={17}
      pointsW={T07_POINTS_W}
      figH={S7_H}
      figure={<SubnetsScene k={k} />}
    />
  )
}

/**
 * T07-1b opens on T07-1's split and builds on: the zones, then the hosts each size holds.
 * Layout (user, 2026-11-05: "enlarge the visual on the right and rework the layout entirely. Keep the visual and adjust
 * its width to fit. Place the points below it, side by side, at equal width"): the drawing across the full box on top,
 * laid out on the wider stage and drawn at T07_Z; the two points beneath it in one row, each half the box. The body
 * with no lead is 418 tall: the stage, the gap and one row of two-line tiles (67) fill it. The drawing's empty top band
 * (above the Region chip) is cut by T07B_CUT so it is drawn as large as the height allows.
 */
const T07B_H = 330
const T07B_CUT = 10
const T07_Z = T07B_H / (S7_H - T07B_CUT)
const T07B_W = Math.round(BOX_W / T07_Z)
const T07B_GAP = 16

export function SubnetsOverview2({ lesson }: { lesson: string }) {
  const k = 2 + useBuild(3, 1300, 1000)
  const lit = k - 3
  const pts = T07_POINTS.slice(2).map((text, i) => ({ icon: T07_ICONS[i + 2], text }))
  const pointW = (BOX_W - 24) / 2
  return (
    <Card id="T07-1b" kicker="Subnets Overview" title="CIDR Type Zone" lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: T07B_GAP }}>
        <Stage w={BOX_W} h={T07B_H} active={false}>
          <div className="absolute left-0" style={{ top: -T07B_CUT * T07_Z, width: T07B_W, height: S7_H, transform: `scale(${T07_Z})`, transformOrigin: '0 0' }}>
            <SubnetsScene k={k} w={T07B_W} centred />
          </div>
        </Stage>
        <div className="flex items-stretch" style={{ width: BOX_W, gap: 24 }}>
          {pts.map((p, i) => (
            <LitPoints key={i} items={[p]} lit={lit === i ? 0 : -1} width={pointW} size={17} />
          ))}
        </div>
      </div>
    </Card>
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`. */
export const SUBNETS_CSS = SB_CSS + SIZING_CSS + SPLIT_CSS + ZONES_CSS

/* the rest of the section lives in `subnets-*.tsx` */
export { CidrSizing, CidrSizing2 } from './subnets-sizing'
export { WorkedSplit, SplitTotals, PublicPrivate } from './subnets-split'
export { ZonePlacement, ZonePlacement2 } from './subnets-zones'

