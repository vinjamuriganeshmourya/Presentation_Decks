import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { useBeats } from '@/ui'
import { Card, Stage, At, Fade, Label, Arrow, Traveller, useCycle, STILL, BOX_W } from './scene'
import { Idling, Posed, FACE_WHOLE, BUST, BAKER } from './Cast'
import { TENANTS } from './people'
import { ClaySvg, CloudShape, useEase } from './art'
import { mo } from './motion'
import { TILE_SKIN } from './card'
import { R, usePrefix, Shadow, BlurDef, GlowDef, Lin } from './depth'
import { CloudResources, FurnishedFlat, RESOURCE_VW, RESOURCE_X } from './clay-a'
import { ClayBar, ClayBook, ClayClock, ClayCloud, ClayDesktop, ClayFlats, ClayMainframe, ClayMeter, ClayOsWindow, ClayPadlock, ClayParcel, ClayScale, ClayServerBox, ClayShop, ClayTable, ClayTerminal, FLAT_DOORS, FLAT_W, LAB } from './clay-b'
import { ClayBars, ClayFittedCupboards, ClayMoon, ClayMovingBox, ClayNo, ClayParkedCar, ClayPhone, ClayServerUnit, ClayTaxi } from './clay-d'
import { ClayAtm, ClayBand, ClayBill, ClayBulb, ClayFan, ClayFridge, ClayHouse, ClayLaptop as LaptopC, ClayMessCounter, ClayPlate, ClayRack, ClayServer as ServerC, ClayStove, ClosedCounter, ElectricMeter, TenantTile, TENANT_TONES } from './clay-c'

/**
 * EVERY ANALOGY IN THE DECK IS ONE SCENE PAIR (plan decision 4).
 *
 * Three beats, the reference's three parts in its own words:
 *   1  the everyday scene, labelled with the reference's everyday label
 *   2  `SAME IDEA`: the arrow draws and the cloud scene arrives, labelled with
 *      the reference's cloud label; each everyday object has its cloud twin
 *   3  the claim, the reference's own line, in a strip under both
 *
 * Both scenes are drawn in the lab's flat style; the people are lab
 * characters. The reference's photographs are gone; their descriptions (an
 * ATM "set into a wall, its keypad and card slot lit") are the scenes'
 * accessible names, so not one of the reference's words is lost.
 */

const SW = 470
const SH = 292
const MID = BOX_W - SW * 2

/**
 * REVIEW 2026-10-16 (global rules 3 to 5): no analogy needs a hand. Every
 * sequence runs on `useCycle` (one step every 2400ms, the deck's step), a
 * counting loop completes a lap in about 8s (the deck's lap), a connector
 * draws from its source to its target once its entrance is done, and a
 * transfer is a dot along the path. Everything holds still on harness URLs.
 */

/** True once a slide has been up long enough for its entrances to finish, so an arrow drawn then is seen drawing. Immediately true on harness URLs and in thumbnails. */
function useDrawn(delay = 1100): boolean {
  const instant = useInstant()
  const [d, setD] = useState(STILL || instant)
  useEffect(() => {
    if (d) return
    const t = window.setTimeout(() => setD(true), delay)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return d
}

/** A key on the floor: the tenant's, the flat being ready to move into (slide 9's illustration). Gold is its own colour,
 *  in the render's solids (user, 2026-10-16, slide 5 as the style): a graded gold with a lit crown, a darker underside on
 *  the bow and the blade, a specular on the bow, and a soft blurred shadow on the floor.
 *  Motion layer: it rests on the floor, so its idle is the gentle pulse, not a float that would lift it. */
function ClayKey({ w }: { w: number }) {
  const idle = mo('pulse', 9)
  const id = usePrefix()
  return (
    <ClaySvg w={w} vw={80} vh={36}>
      <defs>
        <BlurDef id={id} sd={2.5} />
        <Lin id={`${id}-gold`} from={R.goldHi} to={R.gold} />
        <Lin id={`${id}-side`} from={R.goldSide} to={R.goldSideDark} />
      </defs>
      <Shadow id={id} cx={40} cy={33} rx={34} ry={2.6} o={0.2} />
      <g className={idle.className} style={idle.style}>
        <circle cx={16} cy={20} r={14} fill={`url(#${id}-side)`} />
        <rect x={26} y={16} width={50} height={8} rx={4} fill={`url(#${id}-side)`} />
        <circle cx={16} cy={18} r={14} fill={`url(#${id}-gold)`} />
        <circle cx={16} cy={18} r={5} fill={R.goldSideDark} />
        <rect x={26} y={14} width={50} height={8} rx={4} fill={`url(#${id}-gold)`} />
        <rect x={58} y={20} width={6} height={9} rx={2} fill={`url(#${id}-side)`} />
        <rect x={68} y={20} width={6} height={12} rx={2} fill={`url(#${id}-side)`} />
        <ellipse cx={11} cy={11} rx={5} ry={2.4} fill={R.goldShine} opacity={0.8} transform="rotate(-30 11 11)" />
        <rect x={30} y={15} width={34} height={2} rx={1} fill={R.goldShine} opacity={0.6} />
      </g>
    </ClaySvg>
  )
}

export function AnalogyScene({
  id,
  kicker,
  lesson,
  everyday,
  cloud,
  claim,
  alt,
  controls,
}: {
  id: string
  kicker: string
  lesson: string
  everyday: { label: string; scene: (beat: number) => ReactNode }
  cloud: { label: string; scene: (beat: number) => ReactNode }
  claim: string
  /** the reference photo's own description, kept as the everyday scene's name */
  alt?: string
  /** a live control under the scenes, when the scene has one */
  controls?: (beat: number) => ReactNode
}) {
  const beat = useBeats(3)
  const ease = useEase()
  return (
    <Card id={id} kicker={kicker} title="Analogy" lesson={lesson} beat={beat} total={3}>
      <div className="flex items-start" style={{ width: BOX_W }}>
        <div className="flex flex-col items-center gap-2.5" style={{ width: SW }}>
          <Stage w={SW} h={SH} active={beat === 1}>
            <div role="img" aria-label={alt ?? everyday.label} className="absolute inset-0">
              {everyday.scene(beat)}
            </div>
          </Stage>
          <Label strong size={16}>
            {everyday.label}
          </Label>
        </div>
        <div className="relative flex flex-col items-center justify-center" style={{ width: MID, height: SH }}>
          <Fade on={beat >= 2}>
            <span className="font-heading text-[14px] font-semibold tracking-[0.08em]" style={{ color: colors.brandDark }}>
              SAME IDEA
            </span>
          </Fade>
          <div className="relative mt-2" style={{ width: 120, height: 20 }}>
            <Arrow x1={10} y1={10} x2={110} y2={10} on={beat >= 2} dashed />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5" style={{ width: SW }}>
          <Stage w={SW} h={SH} active={beat === 2}>
            <div className="absolute inset-0" style={{ opacity: beat >= 2 ? 1 : 0, transition: ease }}>
              {cloud.scene(beat)}
            </div>
            <div className="absolute inset-0 grid place-items-center" style={{ opacity: beat >= 2 ? 0 : 1, transition: ease }}>
              <CloudShape w={120} fill={colors.surface2} shade={colors.line} />
            </div>
          </Stage>
          <Fade on={beat >= 2}>
            <Label strong size={16} tone="brand">
              {cloud.label}
            </Label>
          </Fade>
        </div>
      </div>
      {controls && <div className="mt-3 flex justify-center" style={{ width: BOX_W }}>{controls(beat)}</div>}
      <Fade on={beat >= 3} className="mt-3">
        <div className="mx-auto w-fit rounded-pill px-6 py-2 font-heading text-[20px] font-semibold" style={{ background: colors.brand, color: colors.white, boxShadow: `0 10px 24px -14px ${colors.brand}` }}>
          {claim}
        </div>
      </Fade>
    </Card>
  )
}

/* ================================================================== the eleven scenes */

/** Cloud Computing Defined: a furnished apartment. */
export function ApartmentAnalogy({ lesson }: { lesson: string }) {
  const step = useCycle(4)
  return (
    <AnalogyScene
      id="nist-analogy"
      kicker="Cloud Computing Defined"
      lesson={lesson}
      everyday={{
        label: 'A furnished apartment',
        /* review 2026-10-16: the flat alone, in the clay look; no person, no bricks, no bag */
        scene: () => (
          <>
            <At x={14} y={14}><FurnishedFlat w={442} /></At>
            {/* review 2026-10-16: the keys on the floor, the move-in itself */}
            <At x={372} y={238}><ClayKey w={68} /></At>
            <At x={318} y={40}><Label tone="good" size={15}>Ready to use</Label></At>
          </>
        ),
      }}
      cloud={{
        label: 'Cloud computing',
        /* the provider's resources under its cloud, each named, ready the same way; review 2026-10-16: a
           packet leaves the cloud for each resource in turn, down the bus line, the provisioning itself */
        scene: () => (
          <>
            <At x={14} y={8}><CloudResources w={442} /></At>
            {['Servers', 'Storage', 'Networks', 'Applications'].map((t, i) => (
              <At key={t} x={14 + (RESOURCE_X[i] * 442) / RESOURCE_VW} y={236} cx>
                <Label tone="brand" size={15}>{t}</Label>
              </At>
            ))}
            <Traveller key={step} k={step} run={!STILL} dur={1.8} size={12} path={[[235, 118], [235, 137], [14 + (RESOURCE_X[step] * 442) / RESOURCE_VW, 137], [14 + (RESOURCE_X[step] * 442) / RESOURCE_VW, 160]]} />
          </>
        ),
      }}
      claim="Move in, do not build"
    />
  )
}

/** Mainframes and time-sharing: a library reading room. */
export function ReadingRoomAnalogy({ lesson }: { lesson: string }) {
  return <ReadingRoom lesson={lesson} />
}

function ReadingRoom({ lesson }: { lesson: string }) {
  /* 2026-10-22: the scheduled-turn build a little faster (2400 -> 1800ms a turn, 700 -> 500ms eases).
     2026-10-23, first pass: the book stopped sliding (a clay svg moved by a transition on `left` re-rasterised
     its filter every frame and stuttered); the reader whose turn it is gets a soft glow instead.
     2026-10-23, the user (this session only): the book slides along the desk to the reader under the glow. It
     moves on a literal `transform` on its own wrapper (`will-change`), never on `left`, so the compositor slides
     the rasterised clay layer and the filter is drawn once per turn, not once per frame. */
  const turn = useCycle(4, 1800, 1)
  const ease = useEase(500)
  const glow = 'radial-gradient(circle, rgba(45,99,251,0.32) 0%, rgba(45,99,251,0.12) 45%, rgba(45,99,251,0) 72%)'
  /* one column per seat, shared by both scenes, so every chip sits centred under its person or terminal on one baseline */
  const seats = [80, 183, 286, 389]
  const CHIP_Y = 238
  const chips = seats.map((x, i) => (
    <At key={`t${i}`} x={x} y={CHIP_Y} cx>
      <Label tone={i === turn ? 'brand' : 'muted'} size={15}>
        {`Turn ${i + 1}`}
      </Label>
    </At>
  ))
  return (
    <AnalogyScene
      id="mainframes-analogy"
      kicker="Mainframes & Time-Sharing"
      lesson={lesson}
      everyday={{
        label: 'A library reading room',
        scene: () => (
          <>
            {/* whose turn it is: a soft glow fades in under that reader (opacity only, nothing moves) */}
            {seats.map((x, i) => (
              <At key={`g${i}`} x={x} y={118} cx cy>
                <div aria-hidden style={{ width: 120, height: 120, borderRadius: 999, background: glow, opacity: i === turn ? 1 : 0, transition: ease }} />
              </At>
            ))}
            {seats.map((x, i) => (
              <At key={i} x={x} y={84} cx>
                <div style={{ opacity: i === turn ? 1 : 0.6, transition: ease }}>
                  <Idling cfg={TENANTS[i]} scale={0.42} crop={BUST} seed={20 + i} />
                </div>
              </At>
            ))}
            <At x={235} y={170} cx><ClayTable w={420} /></At>
            {/* the one shared book slides along the desk to the reader whose turn it is, under the glow */}
            <At x={seats[0]} y={150} cx>
              <div style={{ transform: `translateX(${seats[turn] - seats[0]}px)`, transition: ease, willChange: 'transform' }}>
                <ClayBook w={52} />
              </div>
            </At>
            <At x={408} y={14}><ClayClock w={48} turn={turn / 4} /></At>
            {chips}
          </>
        ),
      }}
      cloud={{
        label: 'Time-sharing',
        scene: () => (
          <>
            <At x={235} y={12} cx><ClayMainframe w={176} /></At>
            {seats.map((x, i) => (
              <At key={i} x={x} y={150} cx>
                <div style={{ opacity: i === turn ? 1 : 0.6, transition: ease }}>
                  <ClayTerminal w={84} lit={i === turn} />
                </div>
              </At>
            ))}
            {chips}
          </>
        ),
      }}
      claim="Everyone gets a scheduled turn"
    />
  )
}

/** Client-server and virtualization: one plot, locked apartments. */
export function PlotAnalogy({ lesson }: { lesson: string }) {
  const FW = 400
  const k = FW / FLAT_W
  return (
    <AnalogyScene
      id="virtualization-analogy"
      kicker="Client-Server & Virtualization"
      lesson={lesson}
      everyday={{
        label: 'One plot, locked apartments',
        scene: () => (
          <>
            {/* one plot, three flats: each furnished its own way, each door numbered and locked (review 2026-10-16: no faces) */}
            <At x={235} y={8} cx>
              <div className="relative" style={{ width: FW }}>
                <ClayFlats w={FW} />
                {FLAT_DOORS.map((d, i) => (
                  <span key={i} className="absolute font-heading text-[14px] font-semibold leading-none text-white" style={{ left: d.x * k, top: d.y * k, transform: 'translateX(-50%)' }}>
                    {i + 1}
                  </span>
                ))}
              </div>
            </At>
            <At x={235} y={256} cx><Label size={15}>One plot</Label></At>
          </>
        ),
      }}
      cloud={{
        label: 'Virtual machines',
        scene: () => <VmStack top={22} w={420} />,
      }}
      claim="One space, divided and locked"
    />
  )
}

/**
 * Three VMs on a hypervisor on one physical server, in clay: each VM a locked
 * card showing its own OS window (a different system in each), the hypervisor
 * and the server as clay slabs. Labels are DOM, so every word is a real element.
 */
export function VmStack({ top = 30, vms = 3, osTag = true, cx = 235, w = 380 }: { top?: number; vms?: number; osTag?: boolean; cx?: number; w?: number }) {
  const ease = useEase()
  const gap = 10
  const tile = (w - gap * 2) / 3
  return (
    <At x={cx} y={top} cx w={w}>
      <div className="flex flex-col" style={{ gap: 8 }}>
        <div className="flex" style={{ gap }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="relative flex flex-col items-center gap-1 rounded-2xl pb-2 pt-3" style={{ width: tile, ...TILE_SKIN, opacity: i < vms ? 1 : 0, transform: i < vms ? 'none' : 'translateY(10px)', transition: ease }}>
              <ClayOsWindow w={Math.round(tile * 0.64)} k={i} />
              <span className="font-heading text-[15px] font-semibold leading-tight" style={{ color: colors.brandDark }}>VM</span>
              {osTag && <span className="text-[14px] leading-tight" style={{ color: colors.ink }}>Its own OS</span>}
              <span className="absolute right-2 top-2"><ClayPadlock w={15} /></span>
            </div>
          ))}
        </div>
        <ClayBar w={w} h={36} fill={LAB.cobalt}>
          <span className="font-heading text-[15px] font-semibold text-white">Hypervisor</span>
        </ClayBar>
        <ClayBar w={w} h={44} fill={LAB.lavender}>
          <ClayServerBox w={30} n={2} />
          <span className="text-[15px] font-medium" style={{ color: colors.ink }}>One physical server</span>
        </ClayBar>
      </div>
    </At>
  )
}

/** Grid and utility computing: one shipping company's trucks. */
export function TruckAnalogy({ lesson }: { lesson: string }) {
  /* each sender's own colour (LAB palette), carried by its parcel and, in the cloud scene, by its job */
  const tones = [LAB.orange, LAB.sage, LAB.periwinkle]
  const weights = ['2 kg', '5 kg', '3 kg']
  const ROWS = [24, 110, 196]
  /* review 2026-10-16: the connectors draw from the desktops to the cloud and on to the meter, then one
     job at a time travels that way: into the pool, then to the bill */
  const drawn = useDrawn()
  const job = useCycle(3)
  return (
    <AnalogyScene
      id="grid-analogy"
      kicker="Grid & Utility Computing"
      lesson={lesson}
      everyday={{
        label: "One shipping company's trucks",
        scene: () => (
          <>
            {/* the senders are shops, not faces (review 2026-10-16) */}
            {ROWS.map((y, i) => (
              <At key={i} x={18} y={y}>
                <div className="flex items-center gap-2">
                  <ClayShop w={62} tone={tones[i]} />
                  <ClayParcel w={30} tone={tones[i]} />
                  <Label size={15} tone="warn">{weights[i]}</Label>
                </div>
              </At>
            ))}
            <At x={192} y={40}><RollingTruck w={212} parcels={tones} /></At>
            <At x={236} y={196}><ClayScale w={70} value={0.6} /></At>
            <At x={318} y={214}><Label size={15}>Pay by weight</Label></At>
          </>
        ),
      }}
      cloud={{
        label: 'Grid and utility computing',
        scene: () => (
          <>
            {ROWS.map((y, i) => (
              <At key={i} x={18} y={y}>
                <div className="flex items-center gap-2">
                  <ClayDesktop w={76} />
                  <ClayParcel w={22} tone={tones[i]} />
                </div>
              </At>
            ))}
            {ROWS.map((y, i) => (
              <Arrow key={i} x1={146} y1={y + 30} x2={176} y2={102 + i * 16} on={drawn} delay={i * 180} />
            ))}
            <At x={176} y={66}><ClayCloud w={146} /></At>
            <At x={284} y={190} cx><Label tone="brand" size={15}>Pooled processing power</Label></At>
            <Arrow x1={324} y1={110} x2={352} y2={100} on={drawn} delay={540} />
            {drawn && <Traveller key={job} k={job} run={!STILL} dur={2.1} size={12} tone={tones[job]} path={[[146, ROWS[job] + 30], [176, 102 + job * 16], [250, 112], [250, 112], [324, 110], [352, 100]]} />}
            <At x={356} y={40}><ClayMeter w={84} value={0.55} /></At>
            <At x={398} y={152} cx><Label size={15}>Metered billing</Label></At>
          </>
        ),
      }}
      claim="Pool the load, pay your share"
    />
  )
}

/* ------------------------------------------------------------------ the rolling truck (slide 23) */

/**
 * THE TRUCK STANDS, AND ITS WHEELS TURN IN PLACE (user, 2026-10-22, second
 * word: "the truck moves jitterish, remove the movement, just rotate the
 * wheels in that place"). The earlier drive-out-and-back is gone: the truck
 * is parked where the still frame has it, and each wheel rotates steadily
 * about its own hub (a linear CSS rotate, one turn every TRUCK_TURN seconds,
 * `transform-box: fill-box` so the centre is the wheel's own). Transform
 * only, inside the one svg, so the truck and its wheels are one entrance
 * unit; `.cc-still`, `.deck-thumb` and reduced motion hold the wheels.
 */
const TRUCK_TURN = 1.6
const TRUCK_CSS = `
@keyframes cc-roll { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.cc-roll { transform-box: fill-box; transform-origin: center; animation: cc-roll ${TRUCK_TURN}s linear infinite; }
.cc-still .cc-roll, .deck-thumb .cc-roll { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .cc-roll { animation: none !important; } }
`
if (typeof document !== 'undefined' && !document.getElementById('cc-truck-css')) {
  const el = document.createElement('style')
  el.id = 'cc-truck-css'
  el.textContent = TRUCK_CSS
  document.head.appendChild(el)
}

function RollingTruck({ w, parcels = [] }: { w: number; parcels?: string[] }) {
  const id = usePrefix()
  const shade = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    const ch = (s: number) => Math.round(((n >> s) & 255) * 0.78).toString(16).padStart(2, '0')
    return `#${ch(16)}${ch(8)}${ch(0)}`
  }
  return (
    <ClaySvg w={w} vw={240} vh={100} large={w > 200}>
      <defs>
        <BlurDef id={id} sd={3} />
        <Lin id={`${id}-box`} from={R.frostTop} to={R.frostSide} />
        <Lin id={`${id}-cab`} from={R.cloudTop} to={R.cloudBot} />
        <Lin id={`${id}-tyre`} from="#4A4A55" to="#23232B" />
        <Lin id={`${id}-glass`} from="#E3F0FF" to={R.cable} />
        {parcels.map((t, i) => (
          <Lin key={i} id={`${id}-p${i}`} from={t} to={shade(t)} />
        ))}
      </defs>
      <g>
        <Shadow id={id} cx={90} cy={95} rx={86} ry={5} />
        {/* the box: a lit top edge, a shaded right side */}
        <rect x={4} y={8} width={116} height={64} rx={10} fill={`url(#${id}-box)`} />
        <rect x={9} y={9.5} width={106} height={2} rx={1} fill="#FFFFFF" opacity={0.7} data-flat />
        <rect x={110} y={12} width={8} height={56} rx={4} fill={R.shadow} opacity={0.08} data-flat />
        {parcels.map((_, i) => (
          <g key={i}>
            <rect x={14 + i * 34} y={34} width={30} height={32} rx={5} fill={`url(#${id}-p${i})`} />
            <rect x={26 + i * 34} y={34} width={6} height={32} fill={R.frostTop} opacity={0.5} data-flat />
          </g>
        ))}
        {/* the cab */}
        <path d="M 122 26 H 150 Q 158 26 162 32 L 174 48 Q 176 52 176 58 V 66 Q 176 72 170 72 H 122 Z" fill={`url(#${id}-cab)`} />
        <path d="M 126 26 H 150 Q 154 26 156 28 H 126 Z" fill="#FFFFFF" opacity={0.35} data-flat />
        <path d="M 130 32 H 148 L 160 48 H 130 Z" fill={`url(#${id}-glass)`} />
        <path d="M 132 34 L 146 34 L 132 44 Z" fill="#FFFFFF" opacity={0.35} data-flat />
        {/* the wheels: tyre, rim, a spoke and a hub, each turning on its own centre */}
        {[36, 146].map((cx) => (
          <g key={cx} transform={`translate(${cx} 76)`}>
            <g className="cc-roll">
              <circle r={13} fill={`url(#${id}-tyre)`} />
              <circle r={8.5} fill="none" stroke={R.frostSide} strokeWidth={1.2} opacity={0.5} />
              <circle r={5} fill={R.frostFront} />
              <rect x={-1.5} y={-11} width={3} height={7} rx={1.5} fill={R.frostFront} opacity={0.85} />
              <rect x={-1.5} y={4} width={3} height={7} rx={1.5} fill={R.frostFront} opacity={0.45} />
              <circle r={1.8} fill={R.needle} />
            </g>
          </g>
        ))}
      </g>
    </ClaySvg>
  )
}

/** On-demand self-service: an ATM. */
export function AtmAnalogy({ lesson }: { lesson: string }) {
  /* 2026-10-23: the card, PIN, cash cycle a step every 1400ms (was 2400) */
  const phase = useCycle(3, 1400, 2)
  return (
    <AnalogyScene
      id="self-service-analogy"
      kicker="On-Demand Self-Service"
      lesson={lesson}
      alt="A bank ATM set into a wall, its keypad and card slot lit"
      everyday={{
        label: 'An ATM',
        scene: () => (
          /* review 2026-10-16: no person, clay objects; the card, PIN and cash cycle is the self-service itself */
          <>
            <At x={50} y={22}><ClayAtm w={150} card={phase >= 1} cash={phase >= 2} lit={phase >= 1} /></At>
            <At x={50} y={238} w={150}>
              <div className="flex justify-center">
                <Label tone={phase >= 2 ? 'good' : 'brand'} size={15}>{phase === 0 ? 'Card in' : phase === 1 ? 'PIN' : 'Cash out'}</Label>
              </div>
            </At>
            <At x={250} y={70}>
              <div className="flex flex-col items-center gap-3">
                <ClosedCounter w={170} />
                <Label tone="muted" size={15}>No queue, no clerk</Label>
              </div>
            </At>
          </>
        ),
      }}
      cloud={{
        label: 'On-demand self-service',
        scene: () => (
          <>
            <At x={30} y={56}>
              <div className="flex flex-col items-center gap-3">
                <LaptopC w={190} lit={phase >= 1} />
                <Label tone={phase >= 1 ? 'dark' : 'plain'} size={15}>Launch Instance</Label>
              </div>
            </At>
            <At x={300} y={54} w={140}>
              <div className="flex flex-col items-center gap-2.5">
                {[0, 1, 2].map((i) => (
                  <Fade key={i} on={phase >= 2 || STILL} delay={i * 120}>
                    <ServerC w={120} />
                  </Fade>
                ))}
                <Label tone="good" size={15}>Ready</Label>
              </div>
            </At>
            <At x={30} y={250}><Label tone="muted" size={15}>Nobody to ask first</Label></At>
          </>
        ),
      }}
      claim="Nobody to ask first"
    />
  )
}

/** Pooling and multi-tenancy: a hostel mess kitchen. */
export function MessAnalogy({ lesson }: { lesson: string }) {
  /* 2026-10-23: a portion every 1400ms (was 2400) */
  const served = useCycle(4, 1400, 3)
  /* the half-body crop raised above the cap and widened to the canvas edge, past the presenting hand (review 2026-10-16: the hand was cut at the wrist) */
  const MESS_CROP = { x0: 70, y0: -36, x1: 400, y1: 392 }
  return (
    <AnalogyScene
      id="pooling-analogy"
      kicker="Pooling And Multi-Tenancy"
      lesson={lesson}
      alt="A serving counter, food portioned out of shared trays with tongs"
      everyday={{
        label: 'A hostel mess kitchen',
        scene: () => (
          <>
            {/* review 2026-10-16: the chef's cap and whole reaching hand inside the crop (MESS_CROP), clay objects throughout;
                the later review: the chef and the students alive, head, eyes and a little hand movement only */}
            <At x={20} y={6}><Posed cfg={BAKER} props scale={0.4} crop={MESS_CROP} expression="happy" gesture="presentRight" amplitude={0.5} at={1.0} alive /></At>
            <At x={14} y={156}><ClayMessCounter w={270} served={served} /></At>
            {[0, 1, 2].map((i) => (
              <At key={i} x={330} y={4 + i * 64}>
                <div className="flex items-center gap-2">
                  <Idling cfg={TENANTS[i]} scale={0.3} crop={FACE_WHOLE} seed={60 + i} alive />
                  <ClayPlate w={56} portions={i < served ? 3 : 0} />
                </div>
              </At>
            ))}
            <At x={372} y={206} cx>
              <div className="flex flex-col items-center gap-1.5 opacity-70">
                <ClayStove w={44} />
                <Label tone="muted" size={15}>No stove per student</Label>
              </div>
            </At>
          </>
        ),
      }}
      cloud={{
        label: 'Resource pooling',
        scene: () => (
          <>
            {/* RE-SYNC 2026-10-22: the rack a size smaller and the tenant rows closer, so the TR's own clause has a line of its own at the foot */}
            <At x={40} y={14}><ClayRack w={100} units={['run', 'run', 'run', 'run', 'run', 'idle']} /></At>
            <At x={90} y={222} cx><Label size={15}>One shared pool</Label></At>
            <At x={24} y={254}><Label size={15} tone="muted">Shares infrastructure dynamically across tenants</Label></At>
            {[0, 1, 2].map((i) => (
              <At key={i} x={200} y={24 + i * 72}>
                <div className="flex items-center gap-3">
                  <TenantTile w={44} tone={TENANT_TONES[i]} />
                  <div className="flex gap-1.5">
                    {Array.from({ length: i + 1 }, (_, k) => (
                      <Fade key={k} on={i < served || STILL} delay={k * 100}>
                        <ServerC w={62} />
                      </Fade>
                    ))}
                  </div>
                </div>
              </At>
            ))}
          </>
        ),
      }}
      claim="One stock, portions on demand"
    />
  )
}

/** Rapid elasticity: a rubber band. */
export function BandAnalogy({ lesson }: { lesson: string }) {
  const k = useCycle(4, 2400, 2)
  const stretch = [0, 0.5, 1, 0.5][k]
  const count = [2, 4, 6, 4][k]
  return (
    <AnalogyScene
      id="elasticity-analogy"
      kicker="Rapid Elasticity"
      lesson={lesson}
      alt="A coil of coloured rubber bands resting on a table"
      everyday={{
        label: 'A rubber band',
        scene: () => (
          <>
            {/* review 2026-10-16: a clay band on a board; the stretch loop is the concept and stays */}
            <At x={235} y={60} cx><ClayBand w={430} stretch={stretch} /></At>
            <At x={235} y={232} cx>
              <Label tone={stretch > 0.7 ? 'warn' : stretch > 0 ? 'brand' : 'good'} size={15}>{stretch > 0.7 ? 'Stretched under load' : stretch > 0 ? 'Stretching' : 'At rest'}</Label>
            </At>
          </>
        ),
      }}
      cloud={{
        label: 'Rapid elasticity',
        scene: () => (
          <>
            <At x={235} y={44} cx w={420}>
              <div className="grid grid-cols-3 justify-items-center gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Fade key={i} on={i < count} lift={6}>
                    <ServerC w={120} />
                  </Fade>
                ))}
              </div>
            </At>
            <At x={235} y={232} cx>
              <Label tone="brand" size={15}>{`${count} instances`}</Label>
            </At>
          </>
        ),
      }}
      claim="Stretch, then spring back"
    />
  )
}

/** The appliance states the meter scene cycles through: two on, all three, one, none. */
const METER_STATES: [boolean, boolean, boolean][] = [
  [true, true, false],
  [true, true, true],
  [false, true, false],
  [false, false, false],
]

/** Measured service: a household electricity meter. Review 2026-10-16: the switches throw themselves, one state every step, so the meter is seen turning and resting. */
export function MeterAnalogy({ lesson }: { lesson: string }) {
  const on = METER_STATES[useCycle(METER_STATES.length)]
  const live = on.filter(Boolean).length
  return (
    <AnalogyScene
      id="measured-analogy"
      kicker="Measured Service"
      lesson={lesson}
      everyday={{
        label: 'A household electricity meter',
        scene: () => (
          <>
            {/* review 2026-10-16: clay house, appliances, meter and bill; the meter's wheel turning is the concept */}
            <At x={24} y={20}><ClayHouse w={110} lit={live > 0} /></At>
            <At x={24} y={150} w={200}>
              <div className="flex items-end gap-4">
                <ClayFan w={50} on={on[0]} />
                <ClayBulb w={36} on={on[1]} />
                <div style={{ opacity: on[2] ? 1 : 0.45 }}><ClayFridge w={42} /></div>
              </div>
            </At>
            <At x={226} y={24}><ElectricMeter w={104} value={live / 3} spin={live > 0 && !STILL} /></At>
            <At x={358} y={36}><ClayBill w={74} rows={live} /></At>
            <At x={226} y={180} w={220}><span className="block text-center text-[15px] font-semibold" style={{ color: colors.ink }}>{live === 0 ? 'Nothing on, the meter rests' : `${live} on, the meter turns`}</span></At>
          </>
        ),
      }}
      cloud={{
        label: 'Measured service',
        scene: () => (
          <>
            <At x={24} y={40} w={150}>
              <div className="flex flex-col gap-3">
                {on.map((x, i) => (
                  <ServerC key={i} w={150} state={x ? 'run' : 'off'} />
                ))}
              </div>
            </At>
            <At x={226} y={24}><ElectricMeter w={104} value={live / 3} spin={live > 0 && !STILL} /></At>
            <At x={358} y={36}><ClayBill w={74} rows={live} /></At>
            <At x={226} y={180} w={220}><span className="block text-center text-[15px] font-semibold" style={{ color: colors.ink }}>{live === 0 ? 'No usage, no charge' : `${live} running, ${live} billed`}</span></At>
            {/* RE-SYNC 2026-10-22: the TR analogy's own clause */}
            <At x={24} y={250}><Label size={15} tone="muted">Meters every compute-second and byte served</Label></At>
          </>
        ),
      }}
      claim="Billed for what was used"
    />
  )
}

/** Cost model shift: renting a taxi (review 2026-10-16: clay objects, no driver). */
export function TaxiAnalogy({ lesson }: { lesson: string }) {
  /* the meter counting trips is the concept, so this loop stays: six trips in a lap of about 8s */
  const fare = useCycle(6, 1300, 4) + 1
  const trips = [3, 6, 2, 8, 4, 5]
  return (
    <AnalogyScene
      id="capex-analogy"
      kicker="Cost Model Shift"
      lesson={lesson}
      alt="A yellow taxi moving through a city street, its surroundings blurred"
      everyday={{
        label: 'Renting a taxi',
        scene: () => (
          <>
            <At x={24} y={22}><ClayTaxi w={230} /></At>
            <At x={276} y={72}><Label tone="good" size={15}>{`Meter: trip ${fare} of 6`}</Label></At>
            <At x={24} y={168}><ClayParkedCar w={190} /></At>
            <At x={236} y={186}>
              <div className="flex flex-col items-start gap-1.5">
                <Label tone="muted" size={15}>Owned car, idle most days</Label>
                <Label tone="warn" size={15}>Loan, insurance, upkeep</Label>
              </div>
            </At>
          </>
        ),
      }}
      cloud={{
        label: 'OpEx cloud billing',
        scene: () => (
          <>
            <At x={30} y={28} w={410}>
              <ClayBars w={410} h={160} values={trips.map((v) => v / 8)} lit={fare} tone="#0055E8" />
              <div className="mt-2 flex justify-between">
                {trips.map((_, i) => (
                  <span key={i} className="text-center text-[14px] font-medium" style={{ width: 410 / 6 - 10, color: colors.ink }}>{`Trip ${i + 1}`}</span>
                ))}
              </div>
            </At>
            <At x={30} y={234}><Label tone="brand" size={15}>Pay per use, nothing between trips</Label></At>
            {/* RE-SYNC 2026-10-22: the TR analogy's own clause */}
            <At x={30} y={262}><Label tone="muted" size={15}>No hardware capacity sitting unused</Label></At>
          </>
        ),
      }}
      claim="Pay for the trip, not the car"
    />
  )
}

/* ================================================================== 57 · Vendor lock-in: fitted cupboards (redesigned 2026-10-22) */

/**
 * Vendor lock-in: a landlord's fitted cupboards (redesigned 2026-10-22, "more
 * visually engaging"). Two pictures that run themselves on the deck's step,
 * each a loop that IS the idea:
 *
 *   kitchen   moving day. The plant and the lamp go out through the doorway
 *             into the box, one per step; then the cupboards strain toward
 *             the door, their bolts flash, and they snap back. The shut sign
 *             lands on the way out and the chip names the reason.
 *   cloud     the application, a glossy tile inside the provider's cloud,
 *             plugged by two cables into its Lambda and DynamoDB sockets. It
 *             lifts toward the other providers' cloud, the cables go taut and
 *             red, it is pulled back, the padlock clicks shut.
 *
 * Every word is a DOM chip (content rule 17); the room, the lamp and the
 * plant are drawn here, the cupboards, box, lock and clouds are the deck's.
 */

/** The kitchen: a warm wall and a wooden floor inside, a doorway, the pavement and sky outside. Flat: it is the room, not an object. */
function Kitchen() {
  const id = usePrefix()
  return (
    <ClaySvg w={470} vw={470} vh={292}>
      <defs>
        <Lin id={`${id}-wall`} from="#FFF7EC" to="#F2DCC0" />
        <Lin id={`${id}-floor`} from="#E8B274" to="#C4844E" />
        <Lin id={`${id}-sky`} from="#C9DFFF" to="#EDF4FF" />
        <Lin id={`${id}-path`} from="#D9E1F0" to="#B7C4E2" />
        <Lin id={`${id}-post`} from="#A3713F" to="#6B4221" x2={1} y2={0} />
      </defs>
      <g data-flat>
        <rect x={0} y={0} width={312} height={292} fill={`url(#${id}-wall)`} />
        <rect x={0} y={220} width={312} height={12} fill="#E6CFB4" />
        <rect x={0} y={232} width={312} height={60} fill={`url(#${id}-floor)`} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={0} y={246 + i * 14} width={312} height={1.5} fill="#A86A33" opacity={0.45} />
        ))}
        <rect x={312} y={0} width={158} height={292} fill={`url(#${id}-sky)`} />
        <rect x={312} y={232} width={158} height={60} fill={`url(#${id}-path)`} />
        <rect x={312} y={230} width={158} height={4} fill="#FFFFFF" opacity={0.65} />
        {/* the doorway: a lintel and a post, lit along the inside edge */}
        <rect x={296} y={6} width={30} height={12} rx={3} fill={`url(#${id}-post)`} />
        <rect x={304} y={14} width={14} height={220} rx={3} fill={`url(#${id}-post)`} />
        <rect x={306} y={16} width={3} height={216} rx={1.5} fill="#FFFFFF" opacity={0.3} />
      </g>
    </ClaySvg>
  )
}

/** A floor lamp: a gold shade over a slim navy stem, its glow pulsing. It is free to leave. */
function Lamp({ w }: { w: number }) {
  const id = usePrefix()
  const glow = mo('glow', 3)
  return (
    <ClaySvg w={w} vw={44} vh={110}>
      <defs>
        <BlurDef id={id} sd={2.5} />
        <Lin id={`${id}-shade`} from={R.goldHi} to={R.gold} />
        <Lin id={`${id}-stem`} from="#4B5578" to="#2E3755" x2={1} y2={0} />
        <GlowDef id={`${id}-glow`} tone={R.goldHi} />
      </defs>
      <Shadow id={id} cx={22} cy={107} rx={15} ry={2.4} o={0.22} />
      <g data-flat className={glow.className} style={glow.style}>
        <ellipse cx={22} cy={32} rx={22} ry={14} fill={`url(#${id}-glow)`} />
      </g>
      <g>
        <rect x={20} y={28} width={4} height={74} rx={2} fill={`url(#${id}-stem)`} />
        <ellipse cx={22} cy={102} rx={12} ry={4} fill="#2E3755" />
        <path d="M 7 30 L 37 30 L 30 4 L 14 4 Z" fill={`url(#${id}-shade)`} />
        <path d="M 16 7 L 12 27" stroke={R.goldShine} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
      </g>
    </ClaySvg>
  )
}

/** A potted plant: three leaves breathing over a terracotta pot. It is free to leave. */
function Plant({ w }: { w: number }) {
  const id = usePrefix()
  const breath = mo('breath', 5)
  return (
    <ClaySvg w={w} vw={44} vh={52}>
      <defs>
        <BlurDef id={id} sd={2} />
        <Lin id={`${id}-pot`} from="#F2A964" to="#C46F34" />
        <Lin id={`${id}-leaf`} from="#5CE39A" to="#1E9A58" />
      </defs>
      <Shadow id={id} cx={22} cy={50} rx={15} ry={2.2} o={0.2} />
      <g className={breath.className} style={breath.style}>
        <ellipse cx={22} cy={20} rx={8} ry={14} fill={`url(#${id}-leaf)`} />
        <ellipse cx={11} cy={25} rx={7} ry={12} fill={`url(#${id}-leaf)`} transform="rotate(-30 11 25)" />
        <ellipse cx={33} cy={25} rx={7} ry={12} fill={`url(#${id}-leaf)`} transform="rotate(30 33 25)" />
      </g>
      <g>
        <path d="M 8 33 L 36 33 L 32 50 L 12 50 Z" fill={`url(#${id}-pot)`} />
        <rect x={6} y={30} width={32} height={6} rx={3} fill="#F2A964" />
        <ellipse cx={14} cy={39} rx={3} ry={5} fill="#FFFFFF" opacity={0.25} />
      </g>
    </ClaySvg>
  )
}

/**
 * A padlock that reads as a padlock at its size (user, 2026-10-22: "icons are
 * not completely in shape, for example the lock"): a thick rounded shackle
 * on a red clay body with a keyhole. `open` lifts and swings the shackle by
 * a transform; it eases shut on the house curve.
 */
function Padlock({ w, open = false }: { w: number; open?: boolean }) {
  const id = usePrefix()
  const ease = useEase()
  return (
    <ClaySvg w={w} vw={40} vh={48}>
      <defs>
        <BlurDef id={id} sd={2} />
        <Lin id={`${id}-body`} from="#FF6A62" to="#C8281E" />
        <Lin id={`${id}-shackle`} from="#D8DFEC" to="#8F9AC4" x2={1} y2={0} />
      </defs>
      <Shadow id={id} cx={20} cy={46} rx={14} ry={2.2} o={0.22} />
      <g style={{ transform: open ? 'translate(-3px, -8px) rotate(-18deg)' : 'none', transformOrigin: '12px 24px', transition: ease }}>
        <path d="M 11 24 V 15 A 9 9 0 0 1 29 15 V 24" fill="none" stroke={`url(#${id}-shackle)`} strokeWidth={5.5} strokeLinecap="round" />
        <path d="M 11 24 V 15 A 9 9 0 0 1 29 15 V 24" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.45} data-flat transform="translate(-1 -1)" />
      </g>
      <rect x={4} y={22} width={32} height={24} rx={6} fill={`url(#${id}-body)`} />
      <rect x={7} y={23.5} width={26} height={2} rx={1} fill="#FFFFFF" opacity={0.4} data-flat />
      <circle cx={20} cy={32} r={3.2} fill="#5B1612" data-flat />
      <rect x={18.6} y={32} width={2.8} height={7} rx={1.4} fill="#5B1612" data-flat />
    </ClaySvg>
  )
}

/** The application's own mark on its tile: four window panes. */
function AppMark() {
  return (
    <span className="grid h-[22px] w-[22px] shrink-0 grid-cols-2 gap-[2px] rounded-[6px] p-[3px]" style={{ background: `linear-gradient(180deg, ${R.cloudTop}, ${R.cloudBot})` }} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="block rounded-[2px]" style={{ background: i === 1 ? R.gold : '#FFFFFF', opacity: 0.95 }} />
      ))}
    </span>
  )
}

/** Where the plant and the lamp stand at home, and how far each travels to land in the box's mouth (scaled about its own foot). */
const PLANT_TRIP = { dx: 294, dy: 98, s: 0.8 }
const LAMP_TRIP = { dx: 378, dy: -20, s: 0.5 }

/**
 * Moving day in the kitchen. `k` is the deck's step: 0 everything home,
 * 1 the plant is packed, 2 the lamp is packed, 3 the cupboards strain toward
 * the door (bolts flashing, the way shut), 4 they have snapped back.
 */
function MovingDay({ k }: { k: number }) {
  const ease = useEase()
  const instant = useInstant()
  const tug = k === 3
  const shut = k >= 3
  const trip = (on: boolean, t: { dx: number; dy: number; s: number }): CSSProperties => ({
    transform: on ? `translate(${t.dx}px, ${t.dy}px) scale(${t.s})` : 'none',
    transformOrigin: 'center bottom',
    transition: instant ? 'none' : 'transform 520ms cubic-bezier(0.22,1,0.36,1)',
  })
  return (
    <>
      <div className="absolute inset-0">
        <Kitchen />
      </div>
      <At x={62} y={60}>
        <div style={{ transform: tug ? 'translateX(12px) rotate(1deg)' : 'none', transformOrigin: 'left bottom', filter: tug ? 'drop-shadow(0 0 7px rgba(216,53,47,0.6))' : 'none', transition: ease }}>
          <ClayFittedCupboards w={224} />
        </div>
      </At>
      {/* the free things, drawn before the box so its front hides their feet once they land in it */}
      <At x={84} y={52}>
        <div style={trip(k >= 1, PLANT_TRIP)}>
          <Plant w={36} />
        </div>
      </At>
      <At x={14} y={126}>
        <div style={trip(k >= 2, LAMP_TRIP)}>
          <Lamp w={36} />
        </div>
      </At>
      <At x={356} y={150}>
        <ClayMovingBox w={96} />
      </At>
      <Arrow x1={292} y1={118} x2={350} y2={118} dashed tone={colors.danger} />
      <At x={321} y={118} cx cy>
        <Fade on={shut} lift={6}>
          <ClayNo w={28} />
        </Fade>
      </At>
      <At x={404} y={240} cx>
        <Label size={15} tone="muted">Moving out</Label>
      </At>
      <At x={16} y={246}>
        <Label size={15} tone="warn">Fitted to this wall</Label>
      </At>
      <At x={160} y={246}>
        <Fade on={shut} lift={6}>
          <Label size={15} tone="bad">Bolted on</Label>
        </Fade>
      </At>
    </>
  )
}

/** How far the tile lifts toward the other cloud before the cables pull it back. */
const LIFT = { dx: 44, dy: -46 }
/** The two sockets just above the chips' tops and the two plug points just under the tile's foot, in stage coordinates
 *  (overlap-check, rule 42, reads a line's svg by its box: the box must clear the tile above and the chips below). */
const SOCKETS = [
  { x: 88, y: 181 },
  { x: 246, y: 181 },
]
const PLUGS = [
  { x: 102, y: 151 },
  { x: 158, y: 151 },
]

/**
 * The application plugged into one provider. `k` is the deck's step: 0 at
 * home on slack cables, 1 lifting toward the other providers' cloud with the
 * cables taut and red, 2 pulled back and locked, 3 the same, held.
 */
function PluggedIn({ k }: { k: number }) {
  const ease = useEase()
  const instant = useInstant()
  const lifted = k === 1
  const locked = k >= 2
  const dx = lifted ? LIFT.dx : 0
  const dy = lifted ? LIFT.dy : 0
  const move = { duration: instant ? 0 : 0.52, ease: easing.soft }
  const float = mo('float', 7)
  return (
    <>
      <At x={10} y={40}>
        <CloudShape w={236} />
      </At>
      <At x={322} y={54}>
        <CloudShape w={132} fill="#A9CBFA" shade="#6F9FE8" />
      </At>
      <At x={24} y={12}>
        <Label size={15} strong tone="dark">One provider</Label>
      </At>
      {/* the cables, from the sockets up to the tile's foot: they follow the tile, and go taut and red while it pulls away.
          One svg per cable, sized to the line AT HOME (overlap-check reads an svg by its box, and the home state is the
          still state it measures); while the tile is lifted the line runs past the box, which `overflow: visible` allows */}
      {SOCKETS.map((s, i) => {
        const p = PLUGS[i]
        const box = {
          x: Math.min(s.x, p.x) - 5,
          y: Math.min(s.y, p.y) - 3,
          w: Math.abs(s.x - p.x) + 10,
          h: Math.abs(s.y - p.y) + 6,
        }
        const x1 = s.x - box.x
        const y1 = s.y - box.y
        const x2 = p.x + dx - box.x
        const y2 = p.y + dy - box.y
        return (
          <svg key={i} aria-hidden className="pointer-events-none absolute" style={{ left: box.x, top: box.y, overflow: 'visible' }} width={box.w} height={box.h}>
            <motion.line x1={x1} y1={y1} initial={false} animate={{ x2, y2 }} transition={move} stroke={lifted ? colors.danger : R.cable} strokeWidth={lifted ? 5 : 6.5} strokeLinecap="round" style={{ transition: ease }} />
            <motion.line x1={x1} y1={y1} initial={false} animate={{ x2, y2 }} transition={move} stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="4 8" opacity={0.6} className="mo mo-dash" />
            <circle cx={x1} cy={y1} r={4.5} fill={colors.brandDark} />
          </svg>
        )
      })}
      <At x={56} y={88}>
        <div style={{ transform: `translate(${dx}px, ${dy}px)`, transition: ease }}>
          <div
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-3 ${float.className}`}
            style={{ width: 150, background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)', boxShadow: `inset 0 0 0 1.5px ${colors.brand}, inset 0 1px 0 #FFFFFF, 0 14px 26px -12px rgba(10,30,90,0.55)`, ...float.style }}
          >
            <AppMark />
            <span className="font-heading text-[14px] font-semibold leading-tight" style={{ color: colors.ink }}>Your application</span>
          </div>
        </div>
      </At>
      <At x={26} y={186}>
        <Label tone="brand" size={15} mono>Lambda triggers</Label>
      </At>
      <At x={188} y={186}>
        <Label tone="brand" size={15} mono>DynamoDB APIs</Label>
      </At>
      <Arrow x1={262} y1={108} x2={320} y2={108} dashed tone={colors.danger} />
      <At x={291} y={108} cx cy>
        <Fade on={locked} lift={6}>
          <ClayNo w={28} />
        </Fade>
      </At>
      <At x={268} y={134}>
        <Padlock w={36} open={!locked} />
      </At>
      <At x={388} y={142} cx>
        <Label size={15}>Other providers</Label>
      </At>
      <At x={16} y={246}>
        <Label tone="warn" size={15}>Built from one provider's parts</Label>
      </At>
    </>
  )
}

export function CupboardAnalogy({ lesson }: { lesson: string }) {
  /* each picture walks its own steps on the deck's one step duration; the still frame (harness URLs, thumbnails) is the settled, shut state */
  const k = useCycle(5, 2400, 4)
  const kc = useCycle(4, 2400, 2)
  return (
    <AnalogyScene
      id="lock-in-analogy"
      kicker="Vendor Lock-In"
      lesson={lesson}
      alt="A kitchen on moving day: cupboards bolted to the wall, a plant and a lamp going out through the doorway into a moving box on the pavement"
      everyday={{
        label: "A landlord's fitted cupboards",
        scene: () => <MovingDay k={k} />,
      }}
      cloud={{
        label: 'Vendor lock-in',
        scene: () => <PluggedIn k={kc} />,
      }}
      claim="Fitted things do not move"
    />
  )
}

/** Cost overruns: roaming left switched on (review 2026-10-16: clay, the plane wholly inside the screen). */
export function RoamingAnalogy({ lesson }: { lesson: string }) {
  /* the charges growing bar by bar is the concept, so this loop stays: seven bars in a lap of about 8s */
  const n = useCycle(7, 1150, 5) + 1
  const bars = (tone: string) => (
    <ClayBars w={236} h={150} values={Array.from({ length: 7 }, (_, i) => (14 + i * i * 2.2) / 100)} lit={n} tone={tone} hot={5} gap={10} />
  )
  return (
    <AnalogyScene
      id="overruns-analogy"
      kicker="Cost Overruns"
      lesson={lesson}
      everyday={{
        label: 'Roaming left switched on',
        scene: () => (
          <>
            <At x={40} y={26}><ClayPhone w={88} /></At>
            <At x={146} y={26}><ClayMoon w={38} /></At>
            <At x={210} y={56}>{bars('#FC963C')}</At>
            {/* RE-SYNC 2026-10-22: the chip carries the TR's "international … during travel"; the charges chip sits above the bars to make room */}
            <At x={24} y={246}><Label tone="warn" size={15}>International roaming left on during travel</Label></At>
            <At x={210} y={22}><Label tone="bad" size={15}>Charges grow overnight</Label></At>
          </>
        ),
      }}
      cloud={{
        label: 'Cost overruns',
        scene: () => (
          <>
            <At x={24} y={110}><ClayServerUnit w={150} /></At>
            <At x={210} y={56}>{bars('#0055E8')}</At>
            <At x={99} y={246} cx><Label tone="warn" size={15}>Forgotten, still running</Label></At>
            <At x={210} y={246}><Label tone="bad" size={15}>Billing until the invoice</Label></At>
          </>
        ),
      }}
      claim="Left on, still charging"
    />
  )
}
