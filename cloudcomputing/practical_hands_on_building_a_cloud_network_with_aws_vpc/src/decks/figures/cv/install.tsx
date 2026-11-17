import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Callout } from '@/ui'
import { Arrow, At, BOX_W, Card, Traveller, useCycle } from '../scene'
import { ClayTerminal, Icon3D, RichCloud } from '../d3/kit'
import { PointsFigure, TableCard } from '../iso/frames'
import { Crop, MARK, Mono, ShotCard, StepLabel, Tile, type MarkName } from './frames'

/**
 * SECTION 2 · DOCKER AND ITS INSTALL (slides 12 to 21).
 *
 *   12  T04-1   the five parts: client -> daemon, the daemon wired to images,
 *               containers and the registry; the loop lights each part in point
 *               order, a command dot leaves the client for the daemon
 *   13  T05-1   the per-OS table, each OS with its mark, commands in monospace
 *   14-20       the TR's install screenshots, cropped, ringed where the caption points
 *   21  T05-S8  the two commands, their line notes, the real output, the Linux callout
 *
 * Every string is the spec's. Harness URLs hold the diagram with every part on
 * and none lit as current.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/* ------------------------------------------------------------------ T04-1 */

/** A part of the diagram: a raised tile, its picture over its name, lit in its turn. */
function Part({ x, y, w, h, lit, name, children }: { x: number; y: number; w: number; h: number; lit: boolean; name: ReactNode; children: ReactNode }) {
  return (
    <At x={x} y={y}>
      <Tile w={w} h={h} lit={lit} className="flex flex-col items-center justify-center gap-2">
        {children}
        <span className="text-center font-heading text-[16px] font-semibold leading-tight" style={{ color: lit ? colors.brandDark : colors.ink, transition: `color 420ms ${EASE}` }}>
          {name}
        </span>
      </Tile>
    </At>
  )
}

/** Three small container boxes, no words (the card names none). */
function Boxes() {
  return (
    <div className="flex items-end gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="block rounded-[6px]" style={{ width: 26, height: 26, background: i === 1 ? colors.brand : '#7FA6FF', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.14), 0 6px 10px -8px rgba(16,32,58,0.6)' }} />
      ))}
    </div>
  )
}

function PartsDiagram() {
  /* 0 client, 1 daemon, 2 images, 3 containers, 4 registry, 5 rest; harness URLs rest (every part on, none lit) */
  const k = useCycle(6, 2400, 5)
  return (
    <div className="absolute inset-0">
      <Arrow x1={130} y1={180} x2={170} y2={180} />
      <Arrow x1={318} y1={140} x2={364} y2={74} />
      <Arrow x1={318} y1={180} x2={364} y2={180} />
      <Arrow x1={318} y1={220} x2={364} y2={286} />
      <Traveller path={[[130, 180], [170, 180]]} run={k === 0} k={`cmd-${k}`} dur={1.2} />

      <Part x={14} y={115} w={116} h={130} lit={k === 0} name="Docker client">
        <ClayTerminal w={72} />
      </Part>
      <Part x={170} y={105} w={148} h={150} lit={k === 1} name={<>Docker daemon<br />(dockerd)</>}>
        <img src={MARK.docker} alt="Docker" draggable={false} className="block w-auto select-none" style={{ height: 40 }} />
      </Part>
      <Part x={364} y={22} w={128} h={104} lit={k === 2} name="Images">
        <Icon3D name="data-storage" w={50} />
      </Part>
      <Part x={364} y={136} w={128} h={88} lit={k === 3} name="Containers">
        <Boxes />
      </Part>
      <Part x={364} y={234} w={128} h={118} lit={k === 4} name="Registry">
        <div className="flex flex-col items-center gap-1">
          <RichCloud w={52} />
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[14px] font-medium leading-tight" style={{ color: colors.muted }}>
            <img src={MARK.docker} alt="" draggable={false} className="block w-auto select-none" style={{ height: 15 }} />
            Docker Hub
          </span>
        </div>
      </Part>
    </div>
  )
}

export function DockerParts({ lesson }: { lesson: string }) {
  return (
    <PointsFigure
      id="T04-1"
      kicker={'Docker Architecture Map'}
      title={'Five Core Parts'}
      lead={'Docker runs as a client-server system: a command-line client talks to a background daemon that builds and runs containers using images pulled from a registry'}
      lesson={lesson}
      points={[
        <>Docker client: CLI issuing commands like <Mono>docker run</Mono></>,
        'Docker daemon (dockerd): service building and managing containers',
        'Images: read-only templates stored locally or in a registry',
        'Containers: running instances created from images',
        'Registry: remote store such as Docker Hub for images',
      ]}
      figure={<PartsDiagram />}
      pointsW={580}
      pointSize={17}
      figH={366}
    />
  )
}

/* ------------------------------------------------------------------ T05-1 */

function Os({ mark, children }: { mark: MarkName; children: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-heading font-semibold">
      <img src={MARK[mark]} alt="" draggable={false} className="block w-auto shrink-0 select-none" style={{ height: 26 }} />
      {children}
    </span>
  )
}

export function SetupPerOs({ lesson }: { lesson: string }) {
  return (
    <TableCard
      id="T05-1"
      kicker={'Docker Installation Steps'}
      title={'Setup Per OS'}
      lead={'Docker installs differently per operating system, but every path ends with the same two verification commands before any practical work begins'}
      lesson={lesson}
      columns={[
        { label: 'OS', weight: 1 },
        { label: 'Key Setup Steps', weight: 3 },
      ]}
      rows={[
        [<Os mark="windows">Windows</Os>, <>Install VS Code; <Mono>wsl --install</Mono>; Docker Desktop (WSL 2 backend); open Docker Desktop</>],
        [<Os mark="macos">macOS</Os>, 'Install VS Code; Docker Desktop (Apple Silicon or Intel build); open Docker Desktop'],
        [<Os mark="ubuntu">Linux / Ubuntu</Os>, <>Install VS Code; <Mono>sudo apt install docker.io</Mono>; <Mono>sudo systemctl start docker</Mono></>],
      ]}
    />
  )
}

/* ------------------------------------------------------------------ T05-S1 .. T05-S7 */

const K = 'Docker Installation Steps'
const T = 'Setup Per OS'

export function InstallStep1({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S1" kicker={K} title={T} lesson={lesson}
      step={'Step 1: Confirm WSL 2 Is Enabled (Windows)'}
      caption={'PowerShell confirms WSL is installed/updated and the Virtual Machine Platform feature is Enabled, required before Docker Desktop will run on Windows'}
      /* a 16px terminal-black margin round the capture (the TR image itself starts mid-letter at its left edge), the
         crop opening above the `wsl --update` line, and each 2px ring's edges set in the gaps between the lines
         (measured on a 2x render), so no ring crosses a letter */
      name="slide-05-1" crop={[-16, 180, 710, 204]} bg="#0C0C0C"
      highlight={[[-10, 198.5, 532, 30], [-10, 348, 196, 13]]} ring={2}
    />
  )
}

export function InstallStep2({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S2" kicker={K} title={T} lesson={lesson}
      step={'Step 2: Choose Installation Options'}
      caption={'Docker Desktop installer: Configuration screen, per-user installation with the WSL 2 backend'}
      name="slide-05-2" crop={[0, 0, 592, 424]}
      highlight={[32, 106, 520, 104]} maxH={330}
    />
  )
}

export function InstallStep3({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S3" kicker={K} title={T} lesson={lesson}
      step={'Step 3: Installation Completes'}
      caption={'Docker Desktop installer confirms “Installation succeeded”'}
      name="slide-05-3" crop={[0, 0, 516, 356]}
      highlight={[20, 80, 160, 24]}
    />
  )
}

export function InstallStep4({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S4" kicker={K} title={T} lesson={lesson}
      step={'Step 4: Sign In Or Skip'}
      caption={'First launch: Docker prompts to sign in or create a Docker Hub account; signing in is optional for local use and can be skipped'}
      name="slide-05-4" crop={[336, 172, 556, 414]}
      highlight={[810, 204, 48, 28]} maxH={330}
    />
  )
}

export function InstallStep5({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S5" kicker={K} title={T} lesson={lesson}
      step={'Step 5: Redirected To The Desktop App'}
      caption={'After sign-in (or skip), Docker redirects back to the desktop app'}
      name="slide-05-5" crop={[36, 28, 280, 184]}
      highlight={[48, 120, 250, 40]} maxH={250}
    />
  )
}

export function InstallStep6({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S6" kicker={K} title={T} lesson={lesson}
      step={'Step 6: Confirm The Redirect'}
      caption={'Windows asks permission to open Docker Desktop, confirms the handoff from browser back to the installed app'}
      name="slide-05-6" crop={[0, 0, 409, 152]}
      highlight={[184, 102, 124, 34]}
    />
  )
}

export function InstallStep7({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T05-S7" kicker={K} title={T} lesson={lesson}
      step={'Step 7: Docker Desktop Opens'}
      caption={'Docker Desktop\'s Containers tab on first launch, empty, since nothing has been run yet'}
      name="slide-05-7" crop={[0, 58, 1000, 470]}
      highlight={[[12, 104, 222, 32], [560, 286, 372, 64]]}
    />
  )
}

/* ------------------------------------------------------------------ T05-S8 */

const PANEL_W = 400

export function InstallStep8({ lesson }: { lesson: string }) {
  const cmd = (n: number, text: string, first: boolean) => (
    <div className="flex items-center gap-3 px-4 font-mono text-[16px]" style={{ background: '#1E1E1E', color: '#E7E7E7', fontVariantLigatures: 'none', borderRadius: first ? 0 : '0 0 12px 12px', paddingBottom: first ? 0 : 6 }}>
      <span style={{ color: '#858585' }}>{n}</span>
      <span>{text}</span>
    </div>
  )
  const note = (children: ReactNode) => (
    <div className="flex items-center pl-4 text-[16px] leading-snug" style={{ color: colors.ink }}>
      <p className="m-0">{children}</p>
    </div>
  )
  const shotW = 650
  return (
    <Card id="T05-S8" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col gap-2.5" style={{ width: BOX_W }}>
        <StepLabel>{'Step 8: Verify From The Terminal'}</StepLabel>
        <div className="grid" style={{ gridTemplateColumns: `${PANEL_W}px 1fr`, gridTemplateRows: 'auto minmax(40px, auto) minmax(40px, auto)' }}>
          <div className="px-4 py-2 text-[14px] font-semibold" style={{ background: '#2D2D2D', color: '#E7E7E7', borderRadius: '12px 12px 0 0' }}>
            {'Terminal (VS Code, PowerShell on Windows)'}
          </div>
          <div />
          {cmd(1, 'docker --version', true)}
          {note('Line 1: Displays the installed Docker CLI version')}
          {cmd(2, 'docker run hello-world', false)}
          {note('Line 2: Verifies that Docker can run a container; it typically pulls the image if needed and prints Hello from Docker!')}
        </div>
        <div className="flex items-start" style={{ gap: 28 }}>
          <figure className="m-0 flex flex-col gap-2" style={{ width: shotW }}>
            <Crop name="slide-05-8" crop={[0, 88, 1110, 352]} highlight={[[28, 126, 530, 32], [28, 230, 1072, 66]]} maxW={shotW} maxH={172} alt="docker --version and docker run hello-world output" />
            <figcaption className="text-[15px] font-semibold leading-snug" style={{ color: colors.ink }}>
              <Mono>docker --version</Mono> displays the installed Docker CLI version; <Mono>docker run hello-world</Mono> confirms the daemon pulled and ran an image, “Hello from Docker!” confirms success
            </figcaption>
          </figure>
          <div style={{ width: BOX_W - shotW - 28 }}>
            <Callout kind="warning" asStep={false} className="!p-4 [&>div>p:first-child]:hidden [&>div>div]:!mt-0 [&>div>div]:text-[16px]">
              <b className="font-heading font-semibold">Linux OS:</b> If a Docker command fails due to permission issues, try running it with <Mono>sudo</Mono>, for example, <span className="whitespace-nowrap"><Mono>sudo docker run hello-world</Mono></span>
            </Callout>
          </div>
        </div>
      </div>
    </Card>
  )
}
