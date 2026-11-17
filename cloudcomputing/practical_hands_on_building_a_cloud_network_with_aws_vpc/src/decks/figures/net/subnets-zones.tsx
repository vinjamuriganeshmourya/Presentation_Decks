import { Fragment, type ReactNode } from 'react'
import { Building2, Check, Copy, LayoutList, MapPin, Unlink, ZapOff } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Label, STILL, Stage, useBuild } from '../scene'
import { CvIcon, fx, LitFigure, Ripple } from './fx'
import { NET, NoMark, SubnetBox } from './frames'
import { Disc, EASE, Host, IconText, MiniChip, Packet, ThinBoundary } from './subnets-parts'
import { SPLIT_ROWS, ZONES, ZONE_TONE } from './subnets-split'

/**
 * T11-1 and T11-1b · TWO ZONES KEEP IT RUNNING. A map of the region: two
 * availability zones drawn as their own places (a data centre on each label),
 * each holding its public-private pair (a server stack
 * and a database), each subnet carrying its zone and CIDR as the console lists
 * them. T11-1b runs the failure: the internet's traffic reaches both zones and
 * flows from each public subnet to its private one; then one zone loses power
 * (its label turns red, a flash, its hosts stopped, its links retract and a
 * broken link sits where its line from the internet ran), and the other zone,
 * lit, its label green with a check, carries all the traffic. The failed zone is dimmed, never removed (must).
 */

const S11_H = 346
/** how far T11-1 lifts the map: the band above the region that only T11-1b's internet uses */
const T11_LIFT = 46
/* the 526 x 346 stage (points column 560, so every point holds to two lines: FS review): the internet above, the
   region (a thin dashed rim on a map tint), two zones as thin solid rims on a tint, a subnet pair in each */
const S11 = {
  globe: { cx: 263, cy: 30, w: 50 },
  reg: { x: 14, y: 64, w: 498, h: 266 },
  zone: { y: 96, w: 226, h: 218, x: [30, 270] },
  box: { dx: 10, w: 206, h: 84, dy: [28, 120] },
  host: 36,
}
const T11_POINTS_W = 560
/** The zone that goes down: the second one. */
const DOWN = 1

/**
 * A zone's own label: a data centre on its tile; on the failed zone, power off and red; on the zone that keeps the
 * traffic, a check and green (the check sits in the label, not on the zone's rim). Zone A's at the left corner, zone
 * B's at the right, so the traffic lines run clear between them.
 */
function ZoneLabel({ failed, held }: { failed: boolean; held: boolean }) {
  return (
    <span className={failed && !STILL ? 'sb-jolt inline-block' : 'inline-block'}>
      <Label size={14} strong tone={failed ? 'bad' : held ? 'good' : 'brand'} raised icon={failed ? <ZapOff /> : held ? <Check /> : <Building2 />}>
        Availability Zone
      </Label>
    </span>
  )
}

/**
 * THE MAP (`k` drives both slides):
 *   T11-1   0 the region and its two empty zones · 1 the subnet pairs, zone B's sliding in from zone A's
 *           side as its copy · 2 the console's zone and CIDR labels (small chips that sit inside their boxes);
 *           after the build every host breathes on its own phase
 *   T11-1b  3 the complete map, the internet above it · 4 traffic: the internet into each public
 *           subnet, each public subnet on to its private one · 5 zone B goes down · 6 zone A carries
 *           all the traffic, lit
 */
function ZonesScene({ k }: { k: number }) {
  const instant = useInstant()
  const pairs = k >= 1
  const labels = k >= 2
  const net = k >= 3
  const flow = k >= 4
  const down = k >= 5
  const held = k >= 6
  const zoneX = (zi: number) => S11.zone.x[zi]
  const boxX = (zi: number) => zoneX(zi) + S11.box.dx
  const boxY = (ri: number) => S11.zone.y + S11.box.dy[ri]
  const hostC = (zi: number, ri: number) => ({ x: boxX(zi) + S11.box.w - 14 - S11.host / 2, y: boxY(ri) + 24 + S11.host / 2 })
  /* the internet's lines: from the globe's foot to each public subnet's top edge, between the zone labels */
  const inLine = (zi: number) => (zi === 0 ? { x1: S11.globe.cx - 12, y1: S11.globe.cy + 24, x2: boxX(0) + 175, y2: boxY(0) } : { x1: S11.globe.cx + 12, y1: S11.globe.cy + 24, x2: boxX(1) + 34, y2: boxY(0) })
  /* each zone's own link: its public host down to its private host */
  const link = (zi: number) => {
    const a = hostC(zi, 0)
    const b = hostC(zi, 1)
    return { x1: a.x, y1: a.y + S11.host / 2 + 2, x2: b.x, y2: b.y - S11.host / 2 - 2 }
  }
  return (
    <>
      {/* the internet above the region (T11-1b) */}
      <At x={S11.globe.cx} y={S11.globe.cy} cx cy>
        <span className="block" style={{ opacity: net ? 1 : 0, transform: net ? 'scale(1)' : 'scale(0.6)', transition: instant ? 'none' : `opacity 400ms ${EASE}, transform 500ms ${EASE}` }}>
          <CvIcon name="globe-www" w={S11.globe.w} />
        </span>
      </At>
      <Ripple x={S11.globe.cx} y={S11.globe.cy} r={22} tone={colors.brand} on={flow} />
      <At x={S11.reg.x} y={S11.reg.y}>
        <ThinBoundary
          dashed
          w={S11.reg.w}
          h={S11.reg.h}
          label={<IconText icon={<MapPin size={13} strokeWidth={2.4} />}>Region</IconText>}
          fill={`radial-gradient(circle at 1px 1px, ${colors.brand}22 1.2px, transparent 1.6px) 0 0 / 16px 16px, ${colors.brand}08`}
        />
      </At>
      {ZONES.map((z, zi) => {
        const failed = down && zi === DOWN
        const lit = held && zi !== DOWN
        return (
          <Fragment key={z}>
            <At x={zoneX(zi)} y={S11.zone.y}>
              <ThinBoundary w={S11.zone.w} h={S11.zone.h} tone={failed ? NET.blocked : NET.boundary} fill={failed ? `${NET.blocked}0F` : `${NET.boundary}0D`}>
                {SPLIT_ROWS.filter((r) => r.zone === z).map((r, ri) => {
                  const pub = r.type === 'Public'
                  return (
                    <At key={r.cidr} x={S11.box.dx} y={S11.box.dy[ri]}>
                      <div
                        style={{
                          opacity: pairs ? (failed ? 0.42 : 1) : 0,
                          transform: pairs ? 'none' : zi === 1 ? 'translateX(-60px)' : 'translateY(12px)',
                          transition: instant ? 'none' : `opacity 480ms ${EASE} ${zi * 360 + ri * 140}ms, transform 620ms ${EASE} ${zi * 360 + ri * 140}ms`,
                        }}
                      >
                        <SubnetBox w={S11.box.w} h={S11.box.h} kind={pub ? 'public' : 'private'} label={r.type} lit={lit}>
                          <At x={S11.box.w - 14} y={24} style={{ transform: 'translateX(-100%)' }}>
                            <span className={`block ${fx('lift', zi * 0.7 + ri * 0.35, 2.8).className}`} style={fx('lift', zi * 0.7 + ri * 0.35, 2.8).style}>
                              <Host icon={pub ? 'server-stack' : 'database'} size={S11.host} lit={lit} badge={zi === DOWN ? <NoMark size={18} on={down} /> : undefined} />
                            </span>
                          </At>
                          {/* the console's listing: the subnet's zone and CIDR, small chips inside the box */}
                          <At x={8} y={33}>
                            <div className="flex flex-col items-start" style={{ gap: 4 }}>
                              {[r.zone, r.cidr].map((t, ti) => (
                                <span key={t} className="block" style={{ opacity: labels ? 1 : 0, transform: labels ? 'none' : 'translateX(-10px)', transition: instant ? 'none' : `opacity 380ms ${EASE} ${zi * 260 + ri * 120 + ti * 70}ms, transform 380ms ${EASE} ${zi * 260 + ri * 120 + ti * 70}ms` }}>
                                  <MiniChip icon={ti === 0 ? <MapPin color={ZONE_TONE[z]} /> : <LayoutList />}>{t}</MiniChip>
                                </span>
                              ))}
                            </div>
                          </At>
                        </SubnetBox>
                      </div>
                    </At>
                  )
                })}
              </ThinBoundary>
            </At>
            {/* the zone's label, on its top edge: zone A's at the left corner, zone B's at the right */}
            <At x={zi === 0 ? zoneX(zi) + 12 : zoneX(zi) + S11.zone.w - 12} y={S11.zone.y} style={{ transform: `translate(${zi === 0 ? '0' : '-100%'}, -50%)` }}>
              <ZoneLabel failed={failed} held={held && zi !== DOWN} />
            </At>
          </Fragment>
        )
      })}
      {/* the traffic: the internet into each public subnet, each public subnet on to its private one; zone B's retract when it fails */}
      {[0, 1].map((zi) => {
        const live = flow && !(down && zi === DOWN)
        const a = inLine(zi)
        const l = link(zi)
        const tone = ZONE_TONE[ZONES[zi]]
        return (
          <Fragment key={`t${zi}`}>
            <Arrow x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} on={live} tone={tone} delay={zi * 200} />
            <Packet x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} on={live} tone={tone} delay={1.1 + zi * 0.4} dur={1.6} />
            {/* rerouted: the failed zone's traffic (its own colour) now rides this zone's lines */}
            {zi !== DOWN && <Packet x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} on={held} tone={ZONE_TONE[ZONES[DOWN]]} delay={0.5} dur={1.6} />}
            {zi !== DOWN && <Packet x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} on={held} tone={ZONE_TONE[ZONES[DOWN]]} delay={1.0} dur={1.2} size={8} />}
            <Arrow x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} on={live} tone={tone} delay={500 + zi * 200} />
            <Packet x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} on={live} tone={tone} delay={1.6 + zi * 0.4} dur={1.2} size={8} />
          </Fragment>
        )
      })}
      {/* the failure: a flash over zone B, its hosts stopped, the broken link where its link was */}
      {down && !STILL && !instant && <span aria-hidden className="sb-flash pointer-events-none absolute rounded-[18px]" style={{ left: zoneX(DOWN), top: S11.zone.y, width: S11.zone.w, height: S11.zone.h, background: NET.blocked, zIndex: 5 }} />}
      {(() => {
        /* the broken link where zone B's line from the internet crossed the band between the region's rim and the zone's */
        const a = inLine(DOWN)
        const y = (S11.reg.y + S11.zone.y) / 2
        const x = a.x1 + ((a.x2 - a.x1) * (y - a.y1)) / (a.y2 - a.y1)
        return (
          <At x={x} y={y} cx cy style={{ zIndex: 6 }}>
            <span className="block" style={{ opacity: down ? 1 : 0, transform: down ? 'scale(1)' : 'scale(0.5)', transition: instant ? 'none' : `opacity 380ms ${EASE} 900ms, transform 460ms cubic-bezier(0.34,1.56,0.64,1) 900ms` }}>
              <Disc size={26} tone={NET.blocked} ink={NET.blocked}>
                <Unlink size={14} strokeWidth={2.5} />
              </Disc>
            </span>
          </At>
        )
      })()}
    </>
  )
}

const T11_POINTS: ReactNode[] = [
  'Production designs duplicate the public-private subnet pair in every zone that is used',
  "The VPC console's Subnets page lists each subnet's assigned availability zone and CIDR",
  'If one zone goes down, only the resources in that zone are affected, so a two-zone design keeps running on the other zone',
]
const T11_ICONS: ReactNode[] = [<Copy key="0" size={20} />, <LayoutList key="1" size={20} />, <ZapOff key="2" size={20} />]

/** T11-1, split in two (user, 2026-10-30, G6): the lead and the two placement points; then the zone that goes down. */
export function ZonePlacement({ lesson }: { lesson: string }) {
  const k = useBuild(3, 1400, 1300)
  return (
    <LitFigure
      id="T11-1"
      kicker="AZ Placement"
      title="High Availability Design"
      lead="Availability zones are physically separate locations within one region, each made up of one or more data centres, so spreading subnet pairs across them keeps an application reachable even if one zone loses power or network"
      lesson={lesson}
      points={T11_POINTS.slice(0, 2).map((text, i) => ({ icon: T11_ICONS[i], text }))}
      lit={k - 1}
      pointsW={T11_POINTS_W}
      pointSize={16}
      figH={S11_H - T11_LIFT}
      figure={
        /* T11-1 has no internet above the region yet: the map is lifted into the band the globe takes on T11-1b, so no strip of the stage stands empty */
        <div className="absolute inset-0" style={{ transform: `translateY(${-T11_LIFT}px)` }}>
          <ZonesScene k={k} />
        </div>
      }
    />
  )
}

/**
 * T11-1b (5.md, 2026-11-04, slide 29: "move the point above the visual; centre the two vertically and horizontally"):
 * the TR's one point is the description over the map, the two one centred column, as T09-2; its words unchanged.
 */
export function ZonePlacement2({ lesson }: { lesson: string }) {
  const k = 3 + useBuild(4, 1700, 1300)
  return (
    <Card id="T11-1b" kicker="AZ Placement" title="High Availability Design" lesson={lesson}>
      <div className="flex flex-col items-center" style={{ width: BOX_W, gap: 18 }}>
        <p className="text-center leading-snug" style={{ maxWidth: 900, fontSize: 20, color: colors.ink }}>
          {T11_POINTS[2]}
        </p>
        <Stage w={BOX_W - T11_POINTS_W - 24} h={S11_H} active={false}>
          <ZonesScene k={k} />
        </Stage>
      </div>
    </Card>
  )
}

export const ZONES_CSS = ``
