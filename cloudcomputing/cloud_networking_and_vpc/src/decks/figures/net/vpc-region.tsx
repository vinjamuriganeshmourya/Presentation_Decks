import type { ReactNode } from 'react'
import { Building2, Check, Cog, Globe, Hash, PencilRuler, ShieldCheck, Sparkles, Split, Wrench } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { BOX_W, Card, Fade, Label, Stage, useBuild } from '../scene'
import { AwsMark, Badge, LitFigure, LitPoints, Ripple } from './fx'
import { Mono, NET, Resource, RouteChip, SubnetBox } from './frames'
import { Act, EASE, Frame, LIT, Status, Tint, useHeld } from './vpc-kit'
import { Flow } from './vpc-society'

/**
 * T04-1 and T04-1b · DEFAULT VPC OR CUSTOM VPC (round 2, FS review 2026-11-04:
 * "too many dotted lines, simplify; improve the icons and animations; the AWS
 * icon touches the border: smaller, centred in its box"; 15: "the same, and a
 * clearer hierarchy").
 *
 * One drawing, two layouts. The only dashed rims left are the two VPCs (and the
 * empty slots before they are built); the region is a thin solid rim, each
 * Availability Zone a borderless tint, every label chip INSIDE its box. The AWS
 * mark sits in the region chip's own icon tile, centred, and never moves.
 *
 *   T04-1   points left (580 wide, every point within two lines), the region
 *           right with the VPCs' contents stacked: 0 two empty slots (point 1),
 *           1 the default VPC appears ready made, its sparkles glowing (point 2),
 *           2 the custom VPC is built piece by piece, its wrench turning (point 3)
 *   T04-1b  the first point is 1128px of text and cannot fit two lines beside a
 *           picture, so the two points sit ABOVE the drawing at full width and the
 *           drawing lays its contents side by side: 0 both VPCs, 1 the CIDR chip and
 *           the range bar the two subnets' blocks slot into (point 1), 2 the
 *           production stamp with a ripple (point 2)
 * The instances' lights, the badges' loops and the range bar's sheen keep moving
 * after the build.
 */

const T041_LEAD = "Isolation is enforced entirely in software: a provider's switches carry traffic for every tenant, but each VPC's address space and routing stay logically separate from the next"
const T041_POINTS_A = [
  { icon: <Split size={20} />, text: 'AWS gives two starting points for building one' },
  { icon: <Sparkles size={20} />, text: 'A default VPC is created automatically in every AWS region, with one public subnet per Availability Zone ready to use' },
  { icon: <Wrench size={20} />, text: 'A custom VPC is built from scratch, letting an engineer choose the address range, subnet layout and route tables deliberately' },
]
const T041_POINTS_B = [
  {
    icon: <Hash size={20} />,
    text: (
      <>
        The VPC's own CIDR (Classless Inter-Domain Routing) block, for example <Mono>10.0.0.0/16</Mono>, sets the outer address range every subnet inside it must fit within
      </>
    ),
  },
  { icon: <ShieldCheck size={20} />, text: 'Production workloads generally use a custom VPC, since the default one is open by design (public subnets), so it is not suited for least-privilege design' },
]

const A_POINTS_W = 580
const A_W = BOX_W - A_POINTS_W - 24
const A_H = 350
const B_H = 254

type Lit = 'slots' | 'default' | 'custom' | 'cidr' | 'production' | null

/** One instance in a subnet, its light on (it is running, ready to use). */
function Instance({ delay = 0 }: { delay?: number }) {
  return (
    <span className="relative block">
      <Resource size={30} />
      <Status x={27} y={3} delay={delay} />
    </span>
  )
}

/** A public subnet (default VPC): its chip left, its running instance right. */
function PublicSubnet({ w, lit, delay }: { w: number; lit: boolean; delay: number }) {
  return (
    <SubnetBox
      w={w}
      h={48}
      kind="public"
      label={
        <span className="inline-flex items-center gap-1">
          {/* public: reachable from the internet, its globe turning slowly */}
          <Act kind="spin" dur={9} delay={-delay * 3}>
            <Globe size={13} aria-hidden />
          </Act>
          Public Subnet
        </span>
      }
      lit={lit}
    >
      <div className="absolute" style={{ right: 9, top: 9 }}>
        <Instance delay={delay} />
      </div>
    </SubnetBox>
  )
}

/** A subnet the engineer built (custom VPC), its route table chip under it. */
function BuiltSubnet({ w, h = 48, lit, on, delay }: { w: number; h?: number; lit: boolean; on: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center">
      <Fade on={on} lift={-12} delay={delay}>
        <SubnetBox w={w} h={h} label="Subnet" lit={lit}>
          <div className="absolute" style={{ right: 9, top: h - 39 }}>
            <Instance delay={delay / 1000} />
          </div>
        </SubnetBox>
      </Fade>
      <Fade on={on} lift={-8} delay={delay + 260} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* the route table steers the subnet's traffic: a short link, a dot running down it */}
        <span aria-hidden className="relative block" style={{ width: 2, height: 12, background: '#AFC2E4' }}>
          {on && <Flow x1={1} y1={0} x2={1} y2={12} tone={colors.brand} n={1} dur={1.4} size={6} />}
        </span>
        <RouteChip label="Route Table" lit={lit} />
      </Fade>
    </div>
  )
}

/** The slot before its VPC exists: an empty dashed outline (it fades as the VPC lands). */
function Slot({ on, lit, children, h }: { on: boolean; lit: boolean; children: ReactNode; h: number }) {
  const instant = useInstant()
  return (
    <div className="relative min-w-0 flex-1" style={{ height: h }}>
      <div aria-hidden className="absolute inset-0" style={{ opacity: on ? 0 : 1, transition: instant ? 'none' : `opacity 420ms ${EASE}` }}>
        <div className="absolute inset-0 rounded-[16px]" style={{ border: `1.5px dashed ${lit ? LIT : '#AFC2E4'}`, background: lit ? 'rgba(45,99,251,0.08)' : 'transparent', transition: instant ? 'none' : `border-color 420ms ${EASE}` }} />
      </div>
      <Fade on={on} lift={10} style={{ position: 'absolute', inset: 0 }}>
        {children}
      </Fade>
    </div>
  )
}

/** The outer address range as a bar; the two subnets' blocks slot into it when `on`. */
function RangeBar({ on, lit }: { on: boolean; lit: boolean }) {
  const instant = useInstant()
  return (
    <div className="relative h-[16px] w-full overflow-hidden rounded-full" style={{ background: colors.white, boxShadow: `inset 0 0 0 1.5px ${lit ? colors.brandDark : NET.boundary}` }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{ left: `calc(${i * 50}% + 4px)`, top: 4, width: 'calc(50% - 8px)', height: 8, background: NET.boundary, transformOrigin: 'left center', transform: on ? 'scaleX(1)' : 'scaleX(0)', transition: instant ? 'none' : `transform 620ms ${EASE} ${240 + i * 220}ms` }}
        />
      ))}
      {on && <span aria-hidden className="cvx-sheen absolute inset-y-0 left-0 w-[30%]" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)', animationIterationCount: 'infinite', animationDuration: '2.6s' }} />}
    </div>
  )
}

function CidrChip({ on, lit }: { on: boolean; lit: boolean }) {
  return (
    <Fade on={on} lift={6}>
      <Label mono strong tone={lit ? 'solid' : 'brand'} raised icon={<Hash />}>
        10.0.0.0/16
      </Label>
    </Fade>
  )
}

function ProductionChip({ on, lit }: { on: boolean; lit: boolean }) {
  return (
    <Fade on={on} lift={6}>
      <span className="relative inline-block">
        {/* once the mark lands it keeps a quiet green pulse, stronger while it is the step's subject */}
        {on && <Ripple x={15} y={14} r={13} tone={colors.success} on n={lit ? 2 : 1} dur={2} />}
        <Label strong tone="good" raised icon={<Check />} iconRound>
          Production
        </Label>
      </span>
    </Fade>
  )
}

/**
 * The AWS region with its two VPCs as peers of one size. `wide` lays each VPC's
 * contents side by side (T04-1b, full width) instead of stacked (T04-1).
 */
function RegionScene({ W, H, wide, stage, cidr = false, production = false, lit }: { W: number; H: number; wide: boolean; stage: number; cidr?: boolean; production?: boolean; lit: Lit }) {
  const regionW = W - 24
  const inner = regionW - 3 - 24
  const slotW = Math.floor((inner - 14) / 2)
  const slotH = H - 24 - 3 - 44 - 12
  const litL = lit === 'default'
  const litR = lit === 'custom'
  /* the default VPC's zones and the custom VPC's subnets */
  const zoneW = wide ? Math.floor((slotW - 3 - 20 - 10) / 2) : slotW - 3 - 20
  const subW = zoneW - 16
  const builtW = wide ? Math.floor((slotW - 3 - 20 - 14) / 2) : slotW - 3 - 20
  const badge = (on: boolean, ring: string, icon: ReactNode) => (
    <Badge on={on} size={28} ring={ring}>
      {icon}
    </Badge>
  )
  return (
    <div className="absolute inset-0 grid place-items-center">
      <Frame
        w={regionW}
        h={H - 24}
        tone={NET.boundary}
        fill="rgba(45,99,251,0.035)"
        label="Region"
        labelIcon={
          <span className="grid h-full w-full place-items-center">
            <AwsMark w={18} />
          </span>
        }
      >
        <div className="flex gap-[14px]" style={{ padding: '10px 12px 12px' }}>
          {/* the default VPC, made for you */}
          <Slot on={stage >= 1} lit={lit === 'slots'} h={slotH}>
            <Frame
              w="100%"
              h="100%"
              dashed
              label="Default"
              labelIcon={<Sparkles />}
              lit={litL}
              extra={badge(
                stage >= 1,
                colors.brand,
                /* created automatically: a gear that keeps turning */
                <Act kind="spin" dur={5}>
                  <Cog size={15} color={colors.brand} />
                </Act>,
              )}
            >
              <div className={`flex ${wide ? 'flex-row' : 'flex-col'} gap-[10px]`} style={{ padding: '10px 10px 0' }}>
                {[0, 1].map((i) => (
                  <Tint key={i} label="Availability Zone" labelIcon={<Building2 />} lit={litL}>
                    <PublicSubnet w={subW} lit={false} delay={i * 0.5} />
                  </Tint>
                ))}
              </div>
            </Frame>
          </Slot>
          {/* the custom VPC, built by hand */}
          <Slot on={stage >= 2} lit={lit === 'slots'} h={slotH}>
            <Frame
              w="100%"
              h="100%"
              dashed
              label="Custom"
              labelIcon={<PencilRuler />}
              lit={litR}
              extra={
                <span className="flex items-center gap-2">
                  {wide && <CidrChip on={cidr} lit={lit === 'cidr'} />}
                  {badge(
                    stage >= 2,
                    colors.brand,
                    <Act kind="wrench" dur={2.2}>
                      <Wrench size={15} color={colors.brand} />
                    </Act>,
                  )}
                </span>
              }
            >
              <div className="flex flex-col gap-[10px]" style={{ padding: '10px 10px 0' }}>
                <div className={`flex ${wide ? 'flex-row justify-between' : 'flex-col'} gap-[10px]`}>
                  {[0, 1].map((i) => (
                    <BuiltSubnet key={i} w={builtW} h={wide ? 48 : 52} lit={false} on={stage >= 2} delay={180 + i * 320} />
                  ))}
                </div>
                {wide && (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <RangeBar on={cidr} lit={lit === 'cidr'} />
                    </div>
                    <ProductionChip on={production} lit={lit === 'production'} />
                  </div>
                )}
              </div>
              {/* T04-1 never shows the CIDR or the production mark; the card's strings stay in the DOM, unseen */}
              {!wide && (
                <div aria-hidden className="pointer-events-none absolute flex gap-2" style={{ left: 10, bottom: 10, opacity: 0 }}>
                  <Label mono size={14}>10.0.0.0/16</Label>
                  <Label size={14}>Production</Label>
                </div>
              )}
            </Frame>
          </Slot>
        </div>
      </Frame>
    </div>
  )
}

export function DefaultCustom({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(3, 1300)
  const lit: Lit = held ? null : k === 0 ? 'slots' : k === 1 ? 'default' : 'custom'
  return <LitFigure id="T04-1" kicker="Default Vs Custom VPC" title="Isolation In Practice" lead={T041_LEAD} lesson={lesson} points={T041_POINTS_A} lit={held ? -1 : k} figure={<RegionScene W={A_W} H={A_H} wide={false} stage={k} lit={lit} />} figH={A_H} pointsW={A_POINTS_W} pointSize={16} />
}

export function DefaultCustom2({ lesson }: { lesson: string }) {
  const held = useHeld()
  const k = useBuild(3, 1300)
  const lit: Lit = held ? null : k === 1 ? 'cidr' : k === 2 ? 'production' : null
  return (
    <Card id="T04-1b" kicker="Default Vs Custom VPC" title="Isolation In Practice" lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 16 }}>
        <LitPoints items={T041_POINTS_B} lit={held ? -1 : k - 1} width={BOX_W} size={17} gap={8} />
        <Stage w={BOX_W} h={B_H} active={false}>
          <RegionScene W={BOX_W} H={B_H} wide stage={2} cidr={k >= 1} production={k >= 2} lit={lit} />
        </Stage>
      </div>
    </Card>
  )
}

