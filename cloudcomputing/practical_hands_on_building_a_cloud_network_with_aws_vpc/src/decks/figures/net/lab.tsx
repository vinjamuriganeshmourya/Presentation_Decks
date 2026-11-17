import type { ReactNode } from 'react'
import { Archive, Ban, Crosshair, Globe, ListChecks, Lock, Network, Repeat, Route, Server, ServerOff, ShieldCheck, Table2, TriangleAlert, Waypoints } from 'lucide-react'
import { colors } from '@/design/tokens'
import { TILE_SKIN } from '../card'
import { BOX_W, Card, Stage, STILL, useBuild } from '../scene'
import { FIG_W, GAP, POINTS_W, lead } from '../iso/frames'
import { AwsMark, Bullet, BulletLine, fx } from './fx'
import { Gateway, Mono, NET, SubnetBox, type Rect } from './frames'
import { VisualTable } from './vtable'
import { LAB_FIGS_CSS, LV, LabVpc, RtGlyph, SF, SecurityFig, StepTiles, stepGlyph } from './lab-figs'
import { ExplainBox, ShotOne, StepHead } from './lab-shots'

/**
 * SECTION 6 · THE LAB (T24-1 to T29-1). Visual pass 2026-11-04 (Session 4's
 * design), then round 2 the same day (the FS team's review, course rule R7;
 * every string the TR's, a long point cut at its own clause boundaries).
 *
 *   58 T24-1  content: Session 4's Part A step tiles (G7 bullets: ring waiting,
 *             arrow now, tick done; the step's glyph on each) beside the
 *             network built step by step in the Mumbai Region, the AWS mark
 *             (static) over it. The numbered 1-6 strip is gone (review).
 *   59 T24-2  content: steps 4-6 the same way on the built network; step 4's
 *             line cut at its clauses into three lines inside its tile
 *   60-63, 65, 66  screenshot: the step label over a rule, ONE enlarged
 *             capture centred with its orange rings (R7.9: no zoom copies, no
 *             number badges), the card's other words in a box below
 *   64 T28-1  table: `VisualTable` (header, row and cell icons, rows one by one)
 *   67 T29-1  content, split: the security group half here (lead, its point cut
 *             in three, the note), the network ACL half in `ExploreSecurity2`
 *             (T29-1b); one figure, acted out per half
 *
 * Steps with auto animation off: the entrance blocks in reading order, then
 * each slide's `useBuild` (58/59: 4 presses; screenshots: one per ring; 64: one
 * per row; 67 and 67b: 4 presses each).
 */

const B = ({ children }: { children: ReactNode }) => <b className="font-heading font-semibold">{children}</b>

/** A continuation line of a step cut at its clause: a diamond sub bullet (G7), on its own line. */
function Sub({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1 flex items-start gap-2">
      <Bullet kind="diamond" size={15} lineH={1.4} />
      <span className="min-w-0">{children}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ T24 */

const STEP_COL = BOX_W - GAP - LV.W // the stage is exactly the lab drawing's width (LV.W)
const STEP_MS = 1300

const T24_LEAD = 'This practical builds a small custom network in the AWS VPC console and shows that a subnet is public because of its route table, not its name'

export function LabSteps1({ lesson }: { lesson: string }) {
  /* 0 the region; 1 step 1, the VPC lands; 2 step 2, the two subnets drop in; 3 step 3, the gateway docks; 4 every step ticked */
  const k = useBuild(5, STEP_MS)
  const cur = STILL || k >= 4 ? -1 : k - 1
  const part = (['vpc', 'subnets', 'igw'] as const)[cur]
  return (
    <Card id="T24-1" kicker="Lab Overview" title="What We Will Do" lead={T24_LEAD} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 14 }}>
        <div className="flex items-center" style={{ width: BOX_W, gap: GAP }}>
          <StepTiles
            width={STEP_COL}
            gap={16}
            k={k}
            items={[
              { text: <>Create a VPC (<Mono>10.0.0.0/16</Mono>) in the <Mono>Mumbai Region</Mono></>, glyph: stepGlyph(0) },
              { text: <>Create a public subnet (<Mono>10.0.1.0/24</Mono>) and a private subnet (<Mono>10.0.2.0/24</Mono>)</>, glyph: stepGlyph(1) },
              { text: 'Create an Internet Gateway and attach it to the VPC', glyph: stepGlyph(2) },
            ]}
          />
          <Stage w={BOX_W - STEP_COL - GAP} h={LV.H + LV.awsBand} active={false}>
            <LabVpc
              parts={{ vpc: k >= 1, subnets: k >= 2, igw: k >= 3, lit: part }}
              regionLabel="Mumbai Region"
              vpcLabel={<>10.0.0.0/16</>}
              pubLabel="10.0.1.0/24"
              priLabel="10.0.2.0/24"
              aws={<AwsMark w={46} />}
            />
          </Stage>
        </div>
      </div>
    </Card>
  )
}

export function LabSteps2({ lesson }: { lesson: string }) {
  /* 0 the network steps 1-3 left; 1 step 4, the route tables and their routes; 2 step 5, the locks and the ACL magnifier; 3 step 6, the ticks; 4 every step ticked */
  const k = useBuild(5, STEP_MS)
  const cur = STILL || k >= 4 ? -1 : k - 1
  const part = (['routes', 'security', 'verify'] as const)[cur]
  return (
    <Card id="T24-2" kicker="Lab Overview" title="What We Will Do" lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 14 }}>
        <div className="flex items-center" style={{ width: BOX_W, gap: GAP }}>
          <StepTiles
            width={STEP_COL}
            size={17}
            k={k}
            items={[
              {
                /* the TR's step 4, cut at its clauses (R7.5, every word kept, in order) */
                text: (
                  <>
                    <span className="block">Create a public route table (default route to the Internet Gateway)</span>
                    <Sub>And a private route table (local route only, no route to the internet)</Sub>
                    <Sub>And associate each with its subnet</Sub>
                  </>
                ),
                glyph: stepGlyph(3),
              },
              { text: 'Create a security group and inspect the network ACL', glyph: stepGlyph(4) },
              { text: 'Verify the VPC, subnets, Internet Gateway and route tables in the console', glyph: stepGlyph(5) },
            ]}
          />
          <Stage w={BOX_W - STEP_COL - GAP} h={LV.H} active={false}>
            <LabVpc parts={{ vpc: true, subnets: true, igw: true, routes: k >= 1, security: k >= 2, verify: k >= 3, lit: part }} vpcLabel="VPC" />
          </Stage>
        </div>
        <NoteList
          size={16}
          items={[
            { icon: <ServerOff />, text: <><B>Important Note:</B> No EC2 instance, NAT Gateway or load balancer is launched, so only the network configuration is verified, not live connectivity</> },
            { icon: <Archive />, text: 'The resources created here should not be deleted, as they will be used in future sessions' },
          ]}
        />
      </div>
    </Card>
  )
}

/** The TR's Important Note as the deck's caution box, one icon bullet per sentence (G7), the icon centred on the first line. */
function NoteList({ items, width = BOX_W, size = 17 }: { items: { icon: ReactNode; text: ReactNode }[]; width?: number; size?: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[16px] px-5 py-3" style={{ width, background: 'linear-gradient(135deg, #FFF7EC 0%, #FFEBD4 100%)', boxShadow: `inset 5px 0 0 0 ${colors.accent}, inset 0 0 0 1px #F8D9B4, 0 12px 24px -18px rgba(229,115,42,0.45)` }}>
      {items.map((it, i) => (
        <BulletLine key={i} kind="icon" size={size} lineH={1.45} tone={colors.accent} icon={<span className="grid h-full w-full place-items-center rounded-[6px] [&>svg]:h-[13px] [&>svg]:w-[13px]" style={{ background: colors.accent, color: colors.white }}>{it.icon}</span>}>
          {it.text}
        </BulletLine>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ the screenshot slides */

/**
 * One screenshot slide (R7.9, the same frame on all six): the step label (the
 * card's caption) over a rule, the ONE capture enlarged to the room left and
 * centred, the card's other words in a box under it.
 */
function LabShot({ id, kicker, title, lesson, leadText, glyph, step, alt, name, rings, maxH, box }: {
  id: string; kicker: string; title: string; lesson: string; leadText?: ReactNode; glyph?: ReactNode; step?: ReactNode; alt: string
  name: string; rings: Rect[]; maxH: number; box?: ReactNode
}) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={leadText} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 14 }}>
        {step && <StepHead glyph={glyph}>{step}</StepHead>}
        <ShotOne name={name} highlight={rings} alt={alt} maxH={maxH} />
        {box}
      </div>
    </Card>
  )
}

/** the capture's height: the body (418) less the step label and the box, or less the label alone, or less the box alone */
const SHOT_H_BOX = 284
const SHOT_H_FULL = 348
const SHOT_H_NOSTEP = 340

/* ===== T25-1 · The VPC, created */

export function VpcCreated({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T25-1"
      kicker="VPC Created"
      title="Address Range Confirmed"
      lesson={lesson}
      leadText={<>The VPC <Mono>s5-cloud-network-vpc</Mono> is created first, with CIDR <Mono>10.0.0.0/16</Mono></>}
      /* the step label under the lead removed (user, 2026-11-05); the capture grows into its room */
      alt="The VPC s5-cloud-network-vpc in the console, state Available, IPv4 CIDR 10.0.0.0/16"
      name="slide-25-1"
      rings={[[405, 205, 120, 32], [780, 345, 110, 32]]}
      maxH={SHOT_H_NOSTEP}
      box={<ExplainBox icon={<Network />}>Every subnet, gateway and route table that follows must belong to it</ExplainBox>}
    />
  )
}

/* ===== T26-1 · The public subnet, created */

export function PublicSubnetCreated({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T26-1"
      kicker="Subnets Created"
      title="Public And Private"
      lesson={lesson}
      leadText={<>Two non-overlapping subnets are created in <Mono>ap-south-1a</Mono></>}
      glyph={<SubnetBox w={18} h={26} kind="public" />}
      step={<><Mono>s5-public-subnet</Mono> (<Mono>10.0.1.0/24</Mono>) created and Available</>}
      alt="s5-public-subnet (10.0.1.0/24) created and Available"
      name="slide-26-1"
      rings={[[70, 255, 160, 32], [762, 255, 115, 32]]}
      maxH={SHOT_H_BOX}
      box={<ExplainBox tone="note" icon={<Route />}>Until a route to the Internet Gateway is added, both subnets are private, whatever their names say</ExplainBox>}
    />
  )
}

/* ===== T26-2 · The private subnet, created */

export function PrivateSubnetCreated({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T26-2"
      kicker="Subnets Created"
      title="Public And Private"
      lesson={lesson}
      glyph={<SubnetBox w={18} h={26} kind="private" />}
      step={<><Mono>s5-private-subnet</Mono> (<Mono>10.0.2.0/24</Mono>) created and Available</>}
      alt="s5-private-subnet (10.0.2.0/24) created and Available"
      name="slide-26-2"
      rings={[[78, 322, 165, 32], [768, 322, 115, 32]]}
      maxH={SHOT_H_FULL}
    />
  )
}

/* ===== T27-1 · The gateway, attached */

export function IgwAttached({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T27-1"
      kicker="Internet Gateway"
      title="Created And Attached"
      lesson={lesson}
      leadText={<>The Internet Gateway <Mono>s5-igw</Mono> is created and attached to the VPC</>}
      glyph={<Gateway kind="igw" size={28} />}
      step={<><Mono>s5-igw</Mono> in Attached state, linked to <Mono>s5-cloud-network-vpc</Mono></>}
      alt="s5-igw in Attached state, linked to s5-cloud-network-vpc"
      name="slide-27-1"
      rings={[[405, 192, 115, 32], [780, 192, 300, 56]]}
      maxH={SHOT_H_BOX}
      box={<ExplainBox tone="note" icon={<Route />}>Attaching it does not make any subnet public; a route table must point to it</ExplainBox>}
    />
  )
}

/* ===== T28-1 · Two route tables, one difference */

/** A cell's glyph before its words (G6: icons in cells), the words unchanged. */
function Cell({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="grid shrink-0 place-items-center" style={{ width: 26, height: 26 }}>
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  )
}

function CellChip({ children, tone = NET.gateway, cls }: { children: ReactNode; tone?: string; cls?: ReturnType<typeof fx> }) {
  return (
    <span className="grid place-items-center rounded-[8px] [&>svg]:h-[15px] [&>svg]:w-[15px]" style={{ width: 26, height: 26, background: colors.white, color: tone, boxShadow: `inset 0 0 0 1.5px ${tone}55` }}>
      <span className={cls?.className} style={{ ...cls?.style, display: 'grid' }}>{children}</span>
    </span>
  )
}

const RT_ROWS: [string, string, string, string][] = [
  ['s5-public-rt', '10.0.0.0/16', 'local', 's5-public-subnet'],
  ['s5-public-rt', '0.0.0.0/0', 's5-igw', 's5-public-subnet'],
  ['s5-private-rt', '10.0.0.0/16', 'local', 's5-private-subnet'],
]

export function RouteTablesTable({ lesson }: { lesson: string }) {
  const dst = (d: string) =>
    d === '0.0.0.0/0' ? <CellChip tone={NET.public} cls={fx('spin', 0, 9)}><Globe /></CellChip> : <span className="grid place-items-center rounded-[7px]" style={{ width: 26, height: 20, border: `2.5px solid ${NET.boundary}`, background: `${NET.boundary}14` }} />
  const tgt = (t: string) => (t === 's5-igw' ? <Gateway kind="igw" size={26} /> : <CellChip cls={fx('spin', 0, 7)}><Repeat /></CellChip>)
  const sub = (s: string) => <SubnetBox w={18} h={24} kind={s.includes('public') ? 'public' : 'private'} />
  return (
    <Card id="T28-1" kicker="Route Tables" title="Public Versus Private" lead={lead(['One route table is created for each subnet', 'The only difference is the default route to the Internet Gateway'])} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          size={18}
          highlight={[1]}
          columns={[
            { label: 'Route Table', icon: <Table2 /> },
            { label: 'Destination', icon: <Crosshair /> },
            { label: 'Target', icon: <Waypoints /> },
            { label: 'Associated Subnet', icon: <Network />, weight: 1.15 },
          ]}
          rows={RT_ROWS.map(([rt, d, t, s]) => ({
            icon: <Table2 />,
            cells: [
              <B key="rt"><Mono>{rt}</Mono></B>,
              <Cell key="d" icon={dst(d)}><Mono>{d}</Mono></Cell>,
              <Cell key="t" icon={tgt(t)}><Mono>{t}</Mono></Cell>,
              <Cell key="s" icon={sub(s)}><Mono>{s}</Mono></Cell>,
            ],
          }))}
        />
      </div>
    </Card>
  )
}

/* ===== T28-2 · Creating the public route table */

export function PublicRtCreated({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T28-2"
      kicker="Route Tables"
      title="Public Versus Private"
      lesson={lesson}
      glyph={<RtGlyph size={30} />}
      step={<>Creating <Mono>s5-public-rt</Mono></>}
      alt="Creating s5-public-rt"
      name="slide-28-1"
      rings={[[50, 196, 122, 30], [50, 368, 404, 32]]}
      maxH={SHOT_H_FULL}
    />
  )
}

/* ===== T28-3 · Creating the private route table */

export function PrivateRtCreated({ lesson }: { lesson: string }) {
  return (
    <LabShot
      id="T28-3"
      kicker="Route Tables"
      title="Public Versus Private"
      lesson={lesson}
      glyph={<RtGlyph size={30} />}
      step={<>Creating <Mono>s5-private-rt</Mono></>}
      alt="Creating s5-private-rt"
      name="slide-28-2"
      rings={[[20, 104, 130, 30], [22, 275, 404, 32]]}
      maxH={SHOT_H_BOX}
      box={
        <ExplainBox tone="note" icon={<TriangleAlert />}>
          <B>Important Note:</B> Select <Mono>s5-cloud-network-vpc</Mono> in the VPC drop-down, not the default VPC
        </ExplainBox>
      }
    />
  )
}

/* ===== T29-1 · Security group and network ACL */

/** The TR's points as raised tiles with an icon bullet each (Session 4's `BPoints`), `lit` the one the figure is on. */
function IconPoints({ items, lit, width = POINTS_W, size = 17 }: { items: { icon: ReactNode; text: ReactNode }[]; lit: number; width?: number; size?: number }) {
  return (
    <div className="flex shrink-0 flex-col" style={{ width, gap: 10 }}>
      {items.map((it, i) => {
        const on = !STILL && i === lit
        return (
          <div
            key={i}
            className="rounded-2xl px-3.5 py-2.5"
            style={{
              ...TILE_SKIN,
              boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
              background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
              transform: on ? 'translateX(4px)' : 'none',
              transition: 'all 420ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <BulletLine kind="icon" icon={it.icon} size={size} lineH={1.4}>
              {it.text}
            </BulletLine>
          </div>
        )
      })}
    </div>
  )
}

const SEC_K = 'Network Security'
const SEC_T = 'Security Group And Network ACL'
const SEC_LEAD = 'The last part of the practical looks at the two filtering layers of the VPC, without launching any resource'
const SEC_MS = 1400

/**
 * T29-1, SPLIT (the FS team's review, 2026-11-04: "split into two slides,
 * break the points into smaller, independently understandable points"). This
 * half is the security group, in the TR's order: the lead, the TR's point cut
 * at its clauses (every word kept, in order), the Important Note that belongs
 * to creating it. The figure: 1 the ring turns solid, its shield pops; 2 an
 * inbound packet stops at it; 3 the resource it guards is ringed.
 */
export function ExploreSecurity({ lesson }: { lesson: string }) {
  const k = useBuild(5, SEC_MS)
  const lit = STILL || k >= 4 ? -1 : k - 1
  return (
    <Card id="T29-1" kicker={SEC_K} title={SEC_T} lead={SEC_LEAD} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: GAP }}>
        <div className="flex flex-col" style={{ width: POINTS_W, gap: 10 }}>
          <IconPoints
            lit={lit}
            items={[
              { icon: <ShieldCheck />, text: <>Security group: create <Mono>s5-demo-sg</Mono> in the VPC</> },
              { icon: <Ban />, text: 'With no inbound rules, and inspect its rules' },
              { icon: <Server />, text: 'It is stateful and applies to resources' },
            ]}
          />
          <ExplainBox tone="note" icon={<TriangleAlert />} width={POINTS_W}>
            <span className="block">
              <B>Important Note:</B> In the VPC field, select <Mono>s5-cloud-network-vpc</Mono>
            </span>
            <span className="block">The default VPC is pre-selected</span>
          </ExplainBox>
        </div>
        <Stage w={FIG_W} h={SF.H} active={false}>
          <SecurityFig k={k} mode="sg" />
        </Stage>
      </div>
    </Card>
  )
}

/**
 * T29-1b, the second half of the split: the network ACL, its TR point cut at
 * its clauses. The figure (the security group already in place): 1 the ACL
 * ring turns solid and its two rule lists are read; 2 a padlock on each list
 * (not changed); 3 the whole subnet is ringed.
 */
export function ExploreSecurity2({ lesson }: { lesson: string }) {
  const k = useBuild(5, SEC_MS)
  const lit = STILL || k >= 4 ? -1 : k - 1
  return (
    <Card id="T29-1b" kicker={SEC_K} title={SEC_T} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: GAP }}>
        <IconPoints
          lit={lit}
          items={[
            { icon: <ListChecks />, text: "Network ACL: inspect the inbound and outbound rules of the VPC's network ACL" },
            { icon: <Lock />, text: 'Without changing them' },
            { icon: <Network />, text: 'It is stateless and applies to a whole subnet' },
          ]}
        />
        <Stage w={FIG_W} h={SF.H} active={false}>
          <SecurityFig k={k} mode="acl" />
        </Stage>
      </div>
    </Card>
  )
}

/** This section's micro-animations (visual pass, 2026-11-04), appended to the deck's CSS by `netDeck.tsx`. */
export const LAB_CSS = LAB_FIGS_CSS
