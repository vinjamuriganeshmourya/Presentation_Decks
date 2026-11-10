import type { CSSProperties, ReactNode } from 'react'
import { AppWindow, Box, Check, SquareTerminal, X } from 'lucide-react'
import { colors } from '@/design/tokens'
import { Arrow, At, BOX_W, Card, Label, Num, useCycle } from '../scene'
import { TILE_SKIN } from '../card'
import { ClayTerminal, LAB } from '../d3/kit'
import { IsoAnalogy, Points, PointsFigure } from '../iso/frames'
import { Crop, LayerStack, Logo, Mono as FrameMono, Slab, STACK, StepLabel, Tile } from './frames'

/**
 * SECTION · DOCKER (slides 22 to 31): image vs container, pull and run, Part A
 * steps, the run command slot by slot, check stop remove, Dockerfile layers,
 * build caching, and the two analogies. Every string is the spec's; the layer
 * stack is the shared `LayerStack`. Each figure runs ONE loop whose motion is
 * the spec's press sequence; on harness URLs every loop holds its most
 * complete frame.
 *
 *   22  a container appears from the image, then two more, then one is removed
 *   23  cakes come from the recipe card one by one; containers from the image
 *   24  first run misses the cache (dashed arrow to the registry), repeat run skips it
 *   25/26  the step strip rings each lit step in turn
 *   27  the four slots of the run command light in turn
 *   28  the strip's stops light one after another
 *   29  the stack grows FROM, COPY, EXPOSE as each line lights
 *   30  COPY changes: its tick and the one above clear, FROM keeps its tick
 *   31  the top floor is redone while the floors below keep their tick
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** The session's `Mono`, kept on one line (a command never breaks across a line end). */
function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      <FrameMono>{children}</FrameMono>
    </span>
  )
}

/** Blank layer names (zero-width, distinct keys): the lock alone says read-only, no invented label. */
const BLANK = ['​', '​​', '​​​']

/* ------------------------------------------------------------------ small drawings */

/** A small container box: an orange writable bar on two cobalt layer bars, in a raised tile. */
function ContainerGlyph({ w = 48 }: { w?: number }) {
  const bw = w - 14
  return (
    <div className="flex flex-col items-center gap-[3px] rounded-[10px] p-[7px]" style={{ width: w, ...TILE_SKIN }}>
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: STACK.writable }} />
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: STACK.layer }} />
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: STACK.layer }} />
    </div>
  )
}

/** A browser window: a title bar with three dots and an address bar, a pale page. */
function BrowserGlyph({ w = 60 }: { w?: number }) {
  const h = Math.round(w * 0.74)
  return (
    <div className="overflow-hidden rounded-[9px]" style={{ width: w, height: h, ...TILE_SKIN }}>
      <div className="flex items-center gap-[3px] px-[6px]" style={{ height: 13, background: LAB.navy }}>
        {[LAB.red, LAB.yellow, LAB.green].map((c) => (
          <span key={c} className="block rounded-full" style={{ width: 5, height: 5, background: c }} />
        ))}
        <span className="ml-1 block flex-1 rounded-full" style={{ height: 5, background: 'rgba(255,255,255,0.55)' }} />
      </div>
      <div className="flex flex-col gap-[4px] p-[6px]">
        <span className="block rounded-full" style={{ width: '70%', height: 6, background: STACK.layer }} />
        <span className="block rounded-full" style={{ width: '90%', height: 4, background: LAB.lavDeep }} />
        <span className="block rounded-full" style={{ width: '80%', height: 4, background: LAB.lavDeep }} />
      </div>
    </div>
  )
}

/** A tile's heading word (`Image`, `Container`, `Daemon`). */
function TileHead({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <div className="text-center font-heading font-bold leading-tight" style={{ fontSize: size, color: colors.brandDark }}>
      {children}
    </div>
  )
}

/** A cache tick in the `LayerStack` style: green when kept, grey when cleared. */
function Tick({ on, size = 28 }: { on: boolean; size?: number }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: on ? colors.success : '#D5DCE8', color: colors.white, transition: `background 420ms ${EASE}` }}>
      <Check size={size * 0.55} strokeWidth={3} />
    </span>
  )
}

/* ================================================================== 22 · T06-1 image vs container */

function ImageScene() {
  /* 0 the image alone, 1 a container from it, 2 two more, 3 one removed while the image stays */
  const k = useCycle(4, 1200, 3)
  const shown = (i: number) => (i === 0 ? k >= 1 : k >= 2)
  const removed = (i: number) => i === 2 && k === 3
  const IMG_W = 150
  const C_W = 120
  return (
    <>
      <At x={24} y={86}>
        <Tile w={IMG_W} lit={k === 1 || k === 2}>
          <div className="flex flex-col items-center gap-2">
            <TileHead>Image</TileHead>
            <LayerStack w={IMG_W - 16} layers={BLANK} h={34} size={14} />
          </div>
        </Tile>
      </At>
      <Arrow x1={184} y1={210} x2={228} y2={210} on={k >= 1} />
      {[0, 1, 2].map((i) => (
        <At key={i} x={236 + i * (C_W + 12)} y={86}>
          <div
            style={{
              opacity: shown(i) ? (removed(i) ? 0.28 : 1) : 0,
              transform: shown(i) ? (removed(i) ? 'scale(0.94)' : 'none') : 'translateX(-16px)',
              filter: removed(i) ? 'grayscale(1)' : 'none',
              transition: `all 300ms ${EASE} ${i === 2 && k === 2 ? 60 : i * 30}ms`,
            }}
          >
            <Tile w={C_W}>
              <div className="flex flex-col items-center gap-2">
                <TileHead size={15}>Container</TileHead>
                <LayerStack w={C_W - 16} layers={BLANK} writable="Writable" h={34} size={14} />
              </div>
            </Tile>
          </div>
          {removed(i) && (
            <span aria-hidden className="absolute grid place-items-center rounded-full" style={{ left: C_W / 2 - 18, top: 92, width: 36, height: 36, background: colors.danger, color: colors.white, boxShadow: `0 0 0 4px ${colors.danger}30` }}>
              <X size={20} strokeWidth={3} />
            </span>
          )}
        </At>
      ))}
    </>
  )
}

export function ImageVsContainer({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T06-1"
      kicker="Image Vs Container"
      title="Template Vs Instance"
      lead="An image is a frozen, read-only template; a container is that template brought to life with its own writable layer on top"
      lesson={lesson}
      points={[
        'Image: built once, never changes, stored by ID and tag',
        'Container: created from an image, has a thin writable layer',
        'One image can start many independent containers',
        'Deleting a container never deletes its source image',
      ]}
      figure={<ImageScene />}
    />
  )
}

/* ================================================================== 23 · T06-AN recipe analogy */

/** A cake on a plate: two iced tiers and a cherry. */
function Cake({ w = 78 }: { w?: number }) {
  return (
    <svg width={w} height={w * 0.72} viewBox="0 0 100 72" aria-hidden>
      <ellipse cx="50" cy="66" rx="46" ry="5" fill={LAB.lavDeep} />
      <rect x="12" y="38" width="76" height="26" rx="7" fill={LAB.wood} />
      <rect x="12" y="38" width="76" height="9" rx="5" fill="#FFE3EE" />
      <rect x="26" y="18" width="48" height="22" rx="6" fill={LAB.wood} />
      <rect x="26" y="18" width="48" height="8" rx="4" fill="#FFE3EE" />
      <path d="M 26 24 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0" fill="none" stroke="#FFE3EE" strokeWidth="3" />
      <path d="M 12 44 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 3 5 6 0" fill="none" stroke="#FFE3EE" strokeWidth="3" />
      <circle cx="50" cy="13" r="6" fill={LAB.red} />
      <circle cx="48" cy="11" r="2" fill="#FFFFFF" opacity="0.6" />
    </svg>
  )
}

/** A recipe card: a white card with an orange heading bar and lines. */
function RecipeCard() {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] p-3" style={{ width: 146, height: 176, transform: 'rotate(-4deg)', ...TILE_SKIN }}>
      <span className="block rounded-full" style={{ width: '70%', height: 13, background: LAB.orange }} />
      {[92, 80, 88, 64, 84, 70, 86].map((p, i) => (
        <span key={i} className="block rounded-full" style={{ width: `${p}%`, height: 8, background: LAB.lavDeep }} />
      ))}
    </div>
  )
}

const AN_STAGE_H = 400
const FAN_Y = [72, 200, 328]

/** The shared layout of both analogy scenes: one source on the left, three made from it on the right. */
function FanScene({ source, sourceLabel, item, k }: { source: ReactNode; sourceLabel: string; item: (i: number) => ReactNode; k: number }) {
  return (
    <>
      <At x={104} y={200} cx cy>
        <div className="flex flex-col items-center gap-2.5">
          {source}
          <Label strong size={17}>{sourceLabel}</Label>
        </div>
      </At>
      {FAN_Y.map((y, i) => (
        <Arrow key={i} x1={196} y1={200} x2={280} y2={y} on={k > i} tone={colors.brand} />
      ))}
      {FAN_Y.map((y, i) => (
        <At key={i} x={372} y={y} cx cy>
          <div style={{ opacity: k > i ? 1 : 0, transform: k > i ? 'none' : 'translateX(-14px)', transition: `all 520ms ${EASE}` }}>{item(i)}</div>
        </At>
      ))}
    </>
  )
}

function CakeScene() {
  const k = useCycle(4, 1800, 3)
  return <FanScene k={k} source={<RecipeCard />} sourceLabel="Recipe card" item={() => <Cake w={112} />} />
}

function ImageFanScene() {
  const k = useCycle(4, 1800, 3)
  return (
    <FanScene
      k={k}
      source={
        <Tile w={156}>
          <LayerStack w={140} layers={BLANK} h={38} size={16} />
        </Tile>
      }
      sourceLabel="Image"
      item={() => (
        <div className="flex items-center gap-2.5 rounded-[14px] p-2.5 pr-3.5" style={TILE_SKIN}>
          <ContainerGlyph w={54} />
          <span className="font-heading text-[17px] font-bold" style={{ color: colors.brandDark }}>Container</span>
        </div>
      )}
    />
  )
}

export function RecipeAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="T06-AN"
      kicker="Image Vs Container"
      title="One recipe, many cakes"
      text="A cake recipe card is reused to bake many separate cakes, just as one Docker image can start many independent containers"
      lesson={lesson}
      everyday={{ label: 'One recipe, many cakes', scene: <CakeScene /> }}
      cloud={{ label: 'One image, many containers', scene: <ImageFanScene /> }}
      bare
      h={AN_STAGE_H}
    />
  )
}

/* ================================================================== 24 · T07-1 pull and run */

const PULL_POINTS_W = 560

function PullScene() {
  /* 0 first run: cache miss, the dashed arrow to the registry; 1 repeat run: daemon straight to container, registry greyed */
  const k = useCycle(2, 3400, 0)
  const miss = k === 0
  const GREY = '#B8C3D6'
  return (
    <>
      {/* the explicit pull: client straight to the registry, faded */}
      <div className="absolute inset-0" style={{ opacity: 0.45 }}>
        <Arrow x1={100} y1={112} x2={366} y2={64} tone={colors.brand} width={2} />
      </div>
      <At x={150} y={46}>
        <div style={{ opacity: 0.6 }}>
          <Label mono size={14}>docker pull</Label>
        </div>
      </At>

      {/* client */}
      <At x={62} y={130} cx>
        <div className="flex flex-col items-center gap-1">
          <ClayTerminal w={96} lit />
          <Label strong size={16}>Client</Label>
        </div>
      </At>

      {/* client -> daemon over the API socket */}
      <Arrow x1={112} y1={180} x2={200} y2={180} />
      <At x={156} y={192} cx>
        <Label size={14} tone="brand">API socket</Label>
      </At>

      {/* daemon, with its cache check */}
      <At x={204} y={138}>
        <Tile w={124} lit>
          <div className="flex flex-col items-center gap-1 py-1">
            <Logo name="docker" h={30} />
            <TileHead>Daemon</TileHead>
          </div>
        </Tile>
      </At>
      <At x={266} y={240} cx>
        <Label size={14} tone={miss ? 'bad' : 'good'} icon={miss ? <X /> : <Check />} iconRound>
          Local image cache
        </Label>
      </At>

      {/* daemon -> registry, dashed, only on a miss */}
      <Arrow x1={332} y1={156} x2={372} y2={106} dashed tone={miss ? colors.accent : GREY} />
      {/* daemon -> container */}
      <Arrow x1={332} y1={204} x2={372} y2={262} />

      {/* registry */}
      <At x={376} y={22}>
        <Tile w={136} dim={!miss}>
          <div className="flex flex-col items-center gap-1 py-1">
            <TileHead>Registry</TileHead>
            <Logo name="docker" h={26} caption="Docker Hub" />
          </div>
        </Tile>
      </At>

      {/* container created */}
      <At x={376} y={238}>
        <Tile w={136} lit={!miss}>
          <div className="flex flex-col items-center gap-1.5 py-1">
            <ContainerGlyph w={46} />
            <TileHead size={15}>Container</TileHead>
          </div>
        </Tile>
      </At>

      {/* which run this is */}
      <At x={20} y={326}>
        <div className="flex items-center gap-2">
          <Label mono size={14}>docker run hello-world</Label>
          <Label size={14} strong tone={miss ? 'warn' : 'good'}>{miss ? 'cache miss' : 'repeat run'}</Label>
        </div>
      </At>
    </>
  )
}

export function PullRun({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T07-1"
      kicker="Client Daemon Registry"
      title="Pull And Run Flow"
      lead="Running an image that the daemon does not have locally triggers a pull from a registry, Docker Hub by default, before a container starts"
      lesson={lesson}
      points={[
        <>Explicit pull: <Mono>docker pull nginx:alpine</Mono> fetches an image with no container created, the same mechanism <Mono>docker run</Mono> triggers automatically</>,
        <><Mono>docker run hello-world</Mono>: no flags, image name only, pulled if absent locally</>,
        "Client sends the request over the daemon's local API socket",
        'Daemon checks its local image cache first by name and tag',
        'Pulled layers are cached, so a repeat run skips the registry',
      ]}
      figure={<PullScene />}
      pointsW={PULL_POINTS_W}
    />
  )
}

/* ================================================================== 25, 26 · T08 Part A steps */

type StepIcon = 'terminal' | 'container' | 'browser'
const STEP_ICONS: StepIcon[] = ['terminal', 'terminal', 'container', 'terminal', 'terminal', 'container', 'terminal', 'browser', 'container', 'container']

function StepIconArt({ kind }: { kind: StepIcon }) {
  if (kind === 'terminal') return <ClayTerminal w={62} />
  if (kind === 'container') return <ContainerGlyph w={46} />
  return <BrowserGlyph w={58} />
}

/** The numbered strip 1 to 10; `from`..`to` lit, the loop rings each lit step in turn. */
function StepStrip({ from, to }: { from: number; to: number }) {
  const n = to - from + 1
  const k = useCycle(n + 1, 2000, n)
  const cell = BOX_W / 10
  return (
    <div className="relative flex" style={{ width: BOX_W, height: 112 }}>
      <span aria-hidden className="absolute rounded-full" style={{ left: cell / 2, right: cell / 2, top: 15, height: 3, background: colors.line }} />
      <span aria-hidden className="absolute rounded-full" style={{ left: cell * (from - 1) + cell / 2, width: cell * (n - 1), top: 15, height: 3, background: colors.brand }} />
      {STEP_ICONS.map((ic, i) => {
        const s = i + 1
        const on = s >= from && s <= to
        const ring = on && s - from === k
        return (
          <div key={s} className="relative flex flex-col items-center gap-2" style={{ width: cell, opacity: on ? 1 : 0.35, transition: `opacity 420ms ${EASE}` }}>
            <Num n={s} on={on} size={32} />
            <div className="grid place-items-center rounded-[14px]" style={{ width: 80, height: 66, boxShadow: ring ? `0 0 0 3px ${colors.accent}` : '0 0 0 0 transparent', transform: ring ? 'translateY(-3px)' : 'none', transition: `all 420ms ${EASE}` }}>
              <StepIconArt kind={ic} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PartA1({ lesson }: { lesson: string }) {
  return (
    <Card id="T08-1" kicker="Part A Practical Steps" title="Images To Containers" lead="Part A works with an existing image, tracing every command from an explicit pull to removing a running web server container" lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <StepStrip from={1} to={5} />
        <Points
          width={BOX_W}
          items={[
            <>Step 1: <Mono>docker pull nginx:alpine</Mono> fetches the image explicitly, before any container runs</>,
            <>Step 2: <Mono>docker images</Mono> lists images already pulled</>,
            <>Step 3: <Mono>docker run hello-world</Mono>; expected Hello from Docker!</>,
            <>Step 4: <Mono>docker ps</Mono> shows currently running containers</>,
            <>Step 5: <Mono>docker ps -a</Mono> shows <Mono>hello-world</Mono> as Exited (0)</>,
          ]}
        />
      </div>
    </Card>
  )
}

export function PartA2({ lesson }: { lesson: string }) {
  return (
    <Card id="T08-2" kicker="Part A Practical Steps" title="Images To Containers" lesson={lesson}>
      <div className="flex flex-col gap-4" style={{ width: BOX_W }}>
        <StepStrip from={6} to={10} />
        <Points
          width={BOX_W}
          items={[
            <>Step 6: <Mono>docker run -d --name web-demo -p 8080:80 nginx:alpine</Mono> starts a server</>,
            <>Step 7: <Mono>docker ps</Mono> confirms <Mono>web-demo</Mono> running with its port mapping</>,
            <>Step 8: browser at <Mono>localhost:8080</Mono> shows Welcome to nginx!</>,
            <>Step 9: <Mono>docker stop web-demo</Mono> halts the container</>,
            <>Step 10: <Mono>docker rm web-demo</Mono> removes it; <Mono>docker ps -a</Mono> confirms it is gone</>,
          ]}
        />
      </div>
    </Card>
  )
}

/* ================================================================== 27 · T09-1 the run command */

const SLOTS: { token: string; meaning: ReactNode }[] = [
  { token: '-d', meaning: <><Mono>-d</Mono>: run in background</> },
  { token: '--name web-demo', meaning: <><Mono>--name web-demo</Mono>: name the container</> },
  { token: '-p 8080:80', meaning: <><Mono>-p 8080:80</Mono>: map host port 8080 to container port 80</> },
  { token: 'nginx:alpine', meaning: <><Mono>nginx:alpine</Mono>: the image used</> },
]

/** A dark code panel with its location in the title bar (the spec's `code.location`). */
function CodePanel({ location, children, style }: { location: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="overflow-hidden rounded-[16px]" style={{ background: colors.brandDeep, boxShadow: '0 18px 36px -22px rgba(16,32,58,0.65)', ...style }}>
      <div className="flex items-center gap-2 px-4" style={{ height: 36, background: 'rgba(255,255,255,0.07)' }}>
        {[LAB.red, LAB.yellow, LAB.green].map((c) => (
          <span key={c} className="block rounded-full" style={{ width: 10, height: 10, background: c }} />
        ))}
        <span className="ml-2 font-mono text-[14px]" style={{ color: 'rgba(255,255,255,0.78)', fontVariantLigatures: 'none' }}>
          {location}
        </span>
      </div>
      {children}
    </div>
  )
}

function RunPanel() {
  const k = useCycle(5, 2200, 4)
  const tok = (i: number) => {
    const on = k === i
    return (
      <span
        className="rounded-[6px] px-1 py-[5px] leading-[1.2]"
        style={{ background: on ? colors.accent : 'rgba(255,255,255,0.08)', color: on ? colors.brandDeep : '#FFFFFF', boxShadow: `inset 0 -3px 0 ${on ? colors.accentDark : 'rgba(109,170,255,0.7)'}`, transition: `all 380ms ${EASE}` }}
      >
        {SLOTS[i].token}
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-3" style={{ width: BOX_W }}>
      <CodePanel location="Terminal (VS Code, PowerShell on Windows)">
        <div className="flex flex-wrap items-center gap-x-[0.6em] px-6 py-5 font-mono text-[28px] leading-none" style={{ color: '#FFFFFF', fontVariantLigatures: 'none' }}>
          <span>docker run</span>
          {tok(0)}
          {tok(1)}
          {tok(2)}
          {tok(3)}
        </div>
      </CodePanel>
      <div className="grid grid-cols-4 gap-3">
        {SLOTS.map((s, i) => (
          <div
            key={s.token}
            className="rounded-[14px] px-3.5 py-2.5 text-[17px] leading-snug"
            style={{ ...TILE_SKIN, color: colors.ink, boxShadow: `${TILE_SKIN.boxShadow}${k === i ? `, 0 0 0 3px ${colors.accent}` : ''}`, transform: k === i ? 'translateY(-3px)' : 'none', transition: `all 380ms ${EASE}` }}
          >
            {s.meaning}
          </div>
        ))}
      </div>
      <p className="m-0 text-[15px] leading-snug" style={{ color: colors.muted }}>
        Line 1: <Mono>-d</Mono>: run in background. <Mono>--name web-demo</Mono>: name the container. <Mono>-p 8080:80</Mono>: map host port 8080 to container port 80. <Mono>nginx:alpine</Mono>: the image used
      </p>
      <div className="flex items-center gap-4 rounded-[14px] px-5 py-3" style={{ background: '#EAF1FF', borderLeft: `5px solid ${colors.brand}` }}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: colors.brand, color: colors.white }}>
          <AppWindow size={20} />
        </span>
        <span className="text-[17px] leading-snug" style={{ color: colors.ink }}>
          Nginx is used only to demonstrate a web application running inside a container, not as a production choice
        </span>
      </div>
    </div>
  )
}

export function RunCommand({ lesson }: { lesson: string }) {
  return (
    <Card id="T09-1" kicker="Container Lifecycle Commands" title="Run Check Stop Remove" lead="A long-running service container is started, mapped to a host port, then checked, stopped and removed through the client-daemon flow" lesson={lesson}>
      <RunPanel />
    </Card>
  )
}

/* ================================================================== 28 · T09-2 check, stop, remove */

const STOPS: { word: string; mono: boolean; icon: ReactNode }[] = [
  { word: 'run', mono: true, icon: <SquareTerminal size={20} /> },
  { word: 'ps', mono: true, icon: <SquareTerminal size={20} /> },
  { word: 'browser', mono: false, icon: <AppWindow size={20} /> },
  { word: 'stop', mono: true, icon: <Box size={20} /> },
  { word: 'rm', mono: true, icon: <Box size={20} /> },
]

function LifeStrip({ w, lit }: { w: number; lit: number }) {
  const cell = w / STOPS.length
  return (
    <div className="relative flex" style={{ width: w, height: 84 }}>
      {STOPS.slice(0, -1).map((_, i) => (
        <Arrow key={i} x1={cell * i + cell / 2 + 28} y1={24} x2={cell * (i + 1) + cell / 2 - 28} y2={24} on tone={i + 1 < lit ? colors.brand : '#C5D0E3'} />
      ))}
      {STOPS.map((s, i) => {
        const on = i < lit
        return (
          <div key={s.word} className="flex flex-col items-center gap-2" style={{ width: cell }}>
            <span className="grid place-items-center rounded-full" style={{ width: 48, height: 48, background: on ? colors.brand : colors.surface2, color: on ? colors.white : colors.brandDark, boxShadow: on ? `0 8px 18px -10px ${colors.brand}` : `inset 0 0 0 1.5px ${colors.line}`, transition: `all 420ms ${EASE}` }}>
              {s.icon}
            </span>
            <span className={`text-[16px] font-semibold leading-none ${s.mono ? 'font-mono' : 'font-heading'}`} style={{ color: on ? colors.brandDark : colors.muted, transition: `color 420ms ${EASE}` }}>
              {s.word}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CheckStopRemove({ lesson }: { lesson: string }) {
  /* the stops light one after another, then the strip starts again */
  const k = useCycle(6, 1800, 5)
  const LEFT = 590
  const RIGHT = BOX_W - LEFT - 32
  return (
    <Card id="T09-2" kicker="Container Lifecycle Commands" title="Run Check Stop Remove" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 32 }}>
        <div className="flex flex-col gap-3" style={{ width: LEFT }}>
          <LifeStrip w={LEFT} lit={k} />
          <Points
            width={LEFT}
            size={17}
            gap={8}
            items={[
              <><Mono>docker images</Mono>: lists cached images before running</>,
              <><Mono>docker ps</Mono>: expected <Mono>web-demo</Mono> Up, PORTS <Mono>0.0.0.0:8080-&gt;80/tcp</Mono></>,
              'Browser at port 8080: expected the Welcome to nginx! page',
              <><Mono>docker stop web-demo</Mono>: expected the container name echoed back</>,
              <><Mono>docker rm web-demo</Mono>: expected <Mono>web-demo</Mono> absent from <Mono>docker ps -a</Mono></>,
            ]}
          />
        </div>
        <figure className="m-0 flex flex-col items-start gap-3" style={{ width: RIGHT }}>
          <StepLabel>Browser Check: Step 8</StepLabel>
          <Crop name="slide-09-1" crop={[0, 0, 800, 132]} highlight={[[6, 4, 150, 36], [416, 66, 362, 58]]} maxW={RIGHT} maxH={220} alt="Browser at localhost:8080 showing Welcome to nginx!" />
          <figcaption className="text-[17px] font-semibold leading-snug" style={{ color: colors.ink }}>
            Browser at <Mono>localhost:8080</Mono>: “Welcome to nginx!” confirms <Mono>web-demo</Mono> is serving traffic
          </figcaption>
        </figure>
      </div>
    </Card>
  )
}

/* ================================================================== 29 · T10-1 Dockerfile to layers */

const DOCKERFILE: { code: string; note: ReactNode }[] = [
  { code: 'FROM nginx:alpine', note: <>Line 1: <Mono>FROM</Mono> sets the base layer</> },
  { code: 'COPY index.html /usr/share/nginx/html/index.html', note: <>Line 2: <Mono>COPY</Mono> adds the HTML layer</> },
  { code: 'EXPOSE 80', note: <>Line 3: <Mono>EXPOSE</Mono> documents port 80, not published yet</> },
]

export function DockerfileLayers({ lesson }: { lesson: string }) {
  /* 0 nothing built, then FROM, COPY, EXPOSE: the lit line and its layer arrive together */
  const k = useCycle(4, 2200, 3)
  const PANEL = 760
  const SIDE = BOX_W - PANEL - 28
  return (
    <Card id="T10-1" kicker="Layers Build Caching" title="Dockerfile To Layers" lead="Each Dockerfile instruction adds one layer on top of the base image; a rebuild reuses an unchanged layer instead of redoing its work" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 28 }}>
        <CodePanel location="cloud-docker-demo/Dockerfile" style={{ width: PANEL }}>
          <div className="flex flex-col gap-3 px-5 py-4">
            {DOCKERFILE.map((l, i) => {
              const on = k === i + 1
              return (
                <div key={l.code} className="flex flex-col gap-2 rounded-[12px] px-3 py-2.5" style={{ background: on ? 'rgba(255,138,61,0.16)' : 'rgba(255,255,255,0.04)', boxShadow: on ? `inset 3px 0 0 ${colors.accent}` : 'none', transition: `all 380ms ${EASE}` }}>
                  <div className="flex items-baseline gap-4 font-mono text-[21px] leading-tight" style={{ fontVariantLigatures: 'none' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{i + 1}</span>
                    <span style={{ color: '#FFFFFF' }}>{l.code}</span>
                  </div>
                  <div className="ml-8 inline-flex w-fit items-center justify-center rounded-[10px] bg-white px-3 text-[17px] leading-none" style={{ color: colors.ink, height: 34 }}>
                    <span>{l.note}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CodePanel>
        <div className="flex justify-center" style={{ width: SIDE }}>
          <LayerStack w={220} layers={['EXPOSE', 'COPY', 'FROM']} shown={k} lit={k === 0 ? -1 : 3 - k} h={44} size={18} />
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== 30 · T10-2 build caching */

/** A small warn pill whose word is centred both ways in its box (fixed height, `leading-none`, flex centring). */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 font-heading text-[15px] font-semibold leading-none" style={{ height: 28, background: '#FFF4E0', color: '#9A5B00', boxShadow: `inset 0 0 0 1.5px ${colors.warning}` }}>
      {children}
    </span>
  )
}

function CacheScene() {
  /* 0 every layer ticked; 1 COPY changes: its tick and EXPOSE's clear, FROM keeps its tick */
  const k = useCycle(2, 2800, 1)
  const changed = k === 1
  const W = 280
  const X = (634 - W) / 2 - 10
  return (
    <>
      <At x={X} y={70}>
        <LayerStack w={W} layers={['EXPOSE', 'COPY', 'FROM']} ticks={[!changed, !changed, true]} lit={changed ? 1 : -1} h={44} size={18} />
      </At>
      <At x={X - 16} y={70 + 52 * 2 + 22} cy>
        <div style={{ transform: 'translateX(-100%)', opacity: changed ? 1 : 0, transition: `opacity 420ms ${EASE}` }}>
          <Pill>Changed</Pill>
        </div>
      </At>
    </>
  )
}

export function BuildCache({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T10-2"
      kicker="Layers Build Caching"
      title="Dockerfile To Layers"
      lesson={lesson}
      points={[
        'Cache key: instruction plus the files it touches',
        'A changed instruction invalidates it and every layer after',
        'Stable instructions first, frequently changing ones last',
      ]}
      figure={<CacheScene />}
    />
  )
}

/* ================================================================== 31 · T10-AN house analogy */

const ROW_H = 54
const ROW_GAP = 8 // LayerStack's own gap, so the house rows line up with the layer rows
const AN_STACK_W = 290
const AN_X = (470 - AN_STACK_W) / 2 - 20
const AN_Y = (AN_STAGE_H - (ROW_H * 4 + ROW_GAP * 3)) / 2

/** The house, floor by floor, rows lined up with `LayerStack`'s rows: roof, top floor, lower floors, foundation. */
function HouseScene() {
  const k = useCycle(2, 2600, 1)
  const redo = k === 1
  const floors: { text: string; fill: string; tick: boolean; lit: boolean }[] = [
    { text: 'Top floor', fill: LAB.wood, tick: !redo, lit: redo },
    { text: 'Lower floors', fill: LAB.sage, tick: true, lit: false },
    { text: 'Foundation', fill: LAB.charcoal, tick: true, lit: false },
  ]
  return (
    <At x={AN_X} y={AN_Y}>
      <div className="flex flex-col" style={{ width: AN_STACK_W, gap: ROW_GAP }}>
        <svg width={AN_STACK_W} height={ROW_H} viewBox={`0 0 ${AN_STACK_W} ${ROW_H}`} aria-hidden>
          <path d={`M 8 ${ROW_H} L ${AN_STACK_W / 2} 2 L ${AN_STACK_W - 8} ${ROW_H} Z`} fill={LAB.red} />
          <path d={`M 22 ${ROW_H - 6} L ${AN_STACK_W / 2} 10`} stroke="#FFFFFF" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
        </svg>
        {floors.map((f, i) => (
          <div key={f.text} className="relative" style={{ transform: f.lit ? 'translateY(-2px)' : 'none', transition: `transform 420ms ${EASE}` }}>
            <Slab w={AN_STACK_W} h={ROW_H} fill={f.fill} lit={f.lit} size={19}>
              {f.text}
            </Slab>
            <span className="absolute" style={{ right: -40, top: ROW_H / 2 - 14 }}>
              <Tick on={f.tick} />
            </span>
            {i === 0 && (
              <span aria-hidden className="absolute flex gap-3" style={{ left: 18, top: 13 }}>
                {[0, 1].map((w) => (
                  <span key={w} className="block rounded-[4px]" style={{ width: 20, height: 28, background: LAB.yellow, opacity: 0.9 }} />
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
    </At>
  )
}

function HouseStackScene() {
  const k = useCycle(2, 2600, 1)
  const redo = k === 1
  return (
    <At x={AN_X} y={AN_Y}>
      <LayerStack w={AN_STACK_W} layers={['EXPOSE', 'COPY', 'FROM']} ticks={[!redo, true, true]} lit={redo ? 0 : -1} h={ROW_H} size={19} />
    </At>
  )
}

export function HouseAnalogy({ lesson }: { lesson: string }) {
  return (
    <IsoAnalogy
      id="T10-AN"
      kicker="Layers Build Caching"
      title="A house built floor by floor"
      text="Building a house floor by floor, if the foundation and lower floors remain unchanged, you don't rebuild them when making a change to the top floor, just as Docker reuses cached layers when earlier instructions remain unchanged"
      lesson={lesson}
      everyday={{ label: 'A house built floor by floor', scene: <HouseScene /> }}
      cloud={{ label: 'Build caching', scene: <HouseStackScene /> }}
      bare
      h={AN_STAGE_H}
    />
  )
}

