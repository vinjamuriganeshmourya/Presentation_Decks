import type { ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { CodeBlock } from '@/ui'
import { BOX_W, Card, STILL, useCycle } from '../scene'
import { Crop, Mono, ShotCard, STACK, StepLabel } from './frames'
import { LAB } from '../clay-b'

/**
 * PART B, "Custom Image Trace" (spec cards T11-1 .. T11-8, slides 32 to 39).
 * Every string is the spec's. Commands, file names and image names in `Mono`.
 * T11-4 and T11-8 share ONE `FlowStrip` (the TR's slide 6 flow, redrawn, with
 * browser output added at the end); every other card shows the TR screenshot.
 */

const K = 'Build Run Verify'
const T = 'Custom Image Trace'
const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/** One spec line at the points size. */
function Line({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <p className="m-0 leading-snug" style={{ fontSize: size, color: colors.ink }}>
      {children}
    </p>
  )
}

/** A screenshot caption, as `ShotCard` sets it. */
function ShotCaption({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-center text-[17px] font-semibold leading-snug" style={{ color: colors.ink }}>
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ T11-1 */

export function PartB1({ lesson }: { lesson: string }) {
  return (
    <Card
      id="T11-1"
      kicker={K}
      title={T}
      lead="Part B builds a custom image from a Dockerfile, confirming the same image-container relationship already seen with pulled images"
      lesson={lesson}
    >
      <div className="flex items-center justify-center" style={{ width: BOX_W, gap: 48 }}>
        <div style={{ width: 460 }}>
          <CodeBlock code={'cloud-docker-demo/\n├── index.html\n└── Dockerfile'} filename="Project folder" language="text" chip={false} fontSize={24} />
        </div>
        <div style={{ width: 400 }}>
          <Line size={20}>Lines 1-3: A project folder holding the page content and the build instructions</Line>
        </div>
      </div>
    </Card>
  )
}

/** T11-1, second half: Step 1 as the other step slides show a step. */
export function PartB1b({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T11-1b"
      kicker={K}
      title={T}
      lesson={lesson}
      step="Step 1: Project Folder Created"
      lines={[
        <>
          Step 1: create folder <Mono>cloud-docker-demo/</Mono> with <Mono>index.html</Mono> and <Mono>Dockerfile</Mono>
        </>,
      ]}
      caption={
        <>
          VS Code: <Mono>cloud-docker-demo</Mono> folder created in the file explorer
        </>
      }
      name="slide-11-1"
      crop={[0, 0, 405, 150]}
      highlight={[8, 50, 190, 32]}
      maxH={260}
    />
  )
}

/* ------------------------------------------------------------------ T11-2 */

const INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>My Docker App</title>
</head>
<body>
    <h1>Hello from Docker!</h1>
    <p>This web application is running inside a Docker container.</p>
</body>
</html>`

/**
 * meta.defects, slide 11: the TR code (10 lines) and its screenshot (8 lines)
 * disagree, so they are NOT a matching pair here: the code panel and its note
 * fill the top band, the Step 2 screenshot sits in its own lower band under a
 * rule. The highlight marks the h1 and p lines of THIS code (lines 7 and 8);
 * the note's "Lines 6-7" is the TR's, carried verbatim.
 */
export function PartB2({ lesson }: { lesson: string }) {
  const L = 640
  const R = BOX_W - L - 36
  return (
    <Card id="T11-2" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 12 }}>
        <div className="flex items-center" style={{ gap: 36 }}>
          <div style={{ width: L }}>
            <CodeBlock code={INDEX_HTML} filename="cloud-docker-demo/index.html" language="html" chip={false} fontSize={13} highlight={[7, 8]} />
          </div>
          <div className="flex flex-col gap-3" style={{ width: R }}>
            <Line>Lines 6-7: The heading and paragraph this page serves, shown by the container once built and run</Line>
            <div className="mt-4">
              <StepLabel>
                Step 2: <Mono>index.html</Mono> Written
              </StepLabel>
            </div>
            <Line>
              Step 2: write <Mono>index.html</Mono> with the page content above
            </Line>
          </div>
        </div>
        <figure className="m-0 flex items-center" style={{ gap: 28, borderTop: `1px solid ${colors.line}`, paddingTop: 12 }}>
          <Crop name="slide-11-2" crop={[560, 90, 1040, 270]} maxW={L} maxH={112} alt="VS Code: index.html content: the custom page this container will serve" />
          <figcaption className="text-[17px] font-semibold leading-snug" style={{ color: colors.ink }}>
            VS Code: <Mono>index.html</Mono> content: the custom page this container will serve
          </figcaption>
        </figure>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-3 */

export function PartB3({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T11-3"
      kicker={K}
      title={T}
      lesson={lesson}
      step={
        <>
          Step 3: <Mono>Dockerfile</Mono> Written
        </>
      }
      lines={[
        <>
          Step 3: write <Mono>Dockerfile</Mono> with <Mono>FROM</Mono>, <Mono>COPY</Mono> and <Mono>EXPOSE</Mono>
        </>,
      ]}
      caption={
        <>
          VS Code: <Mono>Dockerfile</Mono> content: <Mono>FROM</Mono>, <Mono>COPY</Mono> and <Mono>EXPOSE</Mono> directives
        </>
      }
      name="slide-11-3"
      crop={[655, 8, 945, 245]}
      highlight={[785, 122, 808, 120]}
      maxH={300}
    />
  )
}

/* ------------------------------------------------------------------ the flow strip (T11-4, T11-8) */

type StopKey = 'file' | 'build' | 'image' | 'run' | 'container' | 'browser'

function FileGlyph({ tone }: { tone: string }) {
  return (
    <svg width="62" height="74" viewBox="0 0 62 74" aria-hidden>
      <path d="M4 4h38l16 16v50H4z" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      <path d="M42 4v16h16" fill="rgba(255,255,255,0.35)" />
      {[24, 33, 42, 51].map((y) => (
        <rect key={y} x="12" y={y} width={y === 51 ? 24 : 36} height="4" rx="2" fill="rgba(255,255,255,0.85)" />
      ))}
    </svg>
  )
}

function ImageGlyph({ tone }: { tone: string }) {
  return (
    <svg width="86" height="74" viewBox="0 0 86 74" aria-hidden>
      {[46, 32, 18, 4].map((y, i) => (
        <path
          key={y}
          d={`M43 ${y}l39 12-39 12L4 ${y + 12}z`}
          fill={tone}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          style={{ opacity: 0.7 + i * 0.1, transition: `fill 420ms ${EASE}` }}
        />
      ))}
    </svg>
  )
}

function ContainerGlyph({ tone }: { tone: string }) {
  return (
    <svg width="88" height="74" viewBox="0 0 88 74" aria-hidden>
      <path d="M6 22l14-14h62L68 22z" fill={tone} style={{ opacity: 0.75, transition: `fill 420ms ${EASE}` }} />
      <path d="M68 22l14-14v52L68 74z" fill={tone} style={{ opacity: 0.6, transition: `fill 420ms ${EASE}` }} />
      <rect x="6" y="22" width="62" height="52" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      {[30, 42, 54].map((x) => (
        <rect key={x} x={x - 2} y="30" width="4" height="36" rx="2" fill="rgba(255,255,255,0.4)" />
      ))}
    </svg>
  )
}

function BrowserGlyph({ tone }: { tone: string }) {
  return (
    <svg width="90" height="70" viewBox="0 0 90 70" aria-hidden>
      <rect x="3" y="3" width="84" height="64" rx="8" fill="#FFFFFF" stroke={tone} strokeWidth="3" style={{ transition: `stroke 420ms ${EASE}` }} />
      <path d="M3 11a8 8 0 0 1 8-8h68a8 8 0 0 1 8 8v8H3z" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      {[11, 19, 27].map((x) => (
        <circle key={x} cx={x} cy="11" r="2.6" fill="rgba(255,255,255,0.85)" />
      ))}
      <rect x="14" y="30" width="46" height="7" rx="3" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      <rect x="14" y="44" width="62" height="4" rx="2" fill="#C9D3E3" />
      <rect x="14" y="53" width="50" height="4" rx="2" fill="#C9D3E3" />
    </svg>
  )
}

const OFF = '#AEBBD0'

/** One stop of the strip: a glyph on a raised plate, its name under it. */
function Stop({ label, lit, dim, glyph }: { label: ReactNode; lit: boolean; dim: boolean; glyph: (tone: string) => ReactNode }) {
  const tone = dim ? OFF : lit ? STACK.layer : OFF
  return (
    <div className="flex flex-col items-center gap-2.5" style={{ width: 168, opacity: dim ? 0.4 : 1, filter: dim ? 'grayscale(1)' : 'none', transition: `all 480ms ${EASE}` }}>
      <div
        className="grid place-items-center rounded-[18px]"
        style={{
          width: 140,
          height: 112,
          background: lit && !dim ? 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FD 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F4F6FA 100%)',
          boxShadow: lit && !dim ? `0 0 0 3px ${colors.accent}, 0 14px 26px -16px ${colors.accent}` : '0 12px 24px -18px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)',
          transform: lit && !dim ? 'translateY(-3px)' : 'none',
          transition: `all 480ms ${EASE}`,
        }}
      >
        {glyph(tone)}
      </div>
      <span className="text-center font-heading text-[17px] font-semibold leading-tight" style={{ color: lit && !dim ? colors.ink : colors.muted, transition: `color 420ms ${EASE}` }}>
        {label}
      </span>
    </div>
  )
}

/** A connector between stops, with its label (a command) above the shaft. */
function Link({ label, lit }: { label?: ReactNode; lit: boolean }) {
  const tone = lit ? colors.accent : '#B8C3D6'
  return (
    <div className="flex flex-col items-center justify-center gap-2" style={{ width: 146, height: 112 }}>
      <span
        className="whitespace-nowrap rounded-full px-2.5 py-1 text-[15px] font-semibold leading-none"
        style={{
          visibility: label ? 'visible' : 'hidden',
          color: lit ? colors.ink : colors.muted,
          background: lit ? '#FFF1D6' : 'transparent',
          boxShadow: lit ? `inset 0 0 0 2px ${colors.accent}` : 'none',
          transition: `all 420ms ${EASE}`,
        }}
      >
        {label ?? '.'}
      </span>
      <svg width="130" height="16" viewBox="0 0 130 16" aria-hidden>
        <line x1="4" y1="8" x2="116" y2="8" stroke={tone} strokeWidth="3.5" strokeLinecap="round" style={{ transition: `stroke 420ms ${EASE}` }} />
        <path d="M114 1l12 7-12 7z" fill={tone} style={{ transition: `fill 420ms ${EASE}` }} />
      </svg>
      <span aria-hidden className="text-[15px] leading-none" style={{ visibility: 'hidden' }}>
        .
      </span>
    </div>
  )
}

/**
 * The TR's slide 6 flow (Dockerfile, Build, Image, Run, Container), redrawn,
 * with browser output at the end. `lit` names the stops in colour; `dim` the
 * stops greyed out. Labels are passed in, so each card uses its own words.
 */
function FlowStrip({ labels, lit, dim = [] }: { labels: Record<StopKey, ReactNode>; lit: StopKey[]; dim?: StopKey[] }) {
  const on = (k: StopKey) => lit.includes(k)
  const off = (k: StopKey) => dim.includes(k)
  return (
    <div className="flex items-start justify-center" style={{ width: BOX_W }}>
      <Stop label={labels.file} lit={on('file')} dim={off('file')} glyph={(t) => <FileGlyph tone={t} />} />
      <Link label={labels.build} lit={on('build')} />
      <Stop label={labels.image} lit={on('image')} dim={off('image')} glyph={(t) => <ImageGlyph tone={t} />} />
      <Link label={labels.run} lit={on('run')} />
      <Stop label={labels.container} lit={on('container')} dim={off('container')} glyph={(t) => <ContainerGlyph tone={t} />} />
      <Link lit={on('browser')} />
      <Stop label={labels.browser} lit={on('browser')} dim={off('browser')} glyph={(t) => <BrowserGlyph tone={t === OFF ? OFF : LAB.navy} />} />
    </div>
  )
}

/** The step lines under a strip, left-aligned in one centred column. */
function StepLines({ lines }: { lines: ReactNode[] }) {
  return (
    <div className="flex flex-col items-start gap-3.5" style={{ width: BOX_W, paddingLeft: 12 }}>
      {lines.map((l, i) => (
        <Line key={i}>{l}</Line>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ T11-4 */

/** Loop: the strip with nothing lit, then docker build and image light. Held lit on harness URLs. */
export function PartB4({ lesson }: { lesson: string }) {
  const k = useCycle(2, 2600, 1)
  const lit: StopKey[] = STILL || k === 1 ? ['build', 'image'] : []
  return (
    <Card id="T11-4" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 64 }}>
        <FlowStrip
          lit={lit}
          labels={{
            file: 'Dockerfile',
            build: <Mono>docker build</Mono>,
            image: 'image',
            run: <Mono>docker run</Mono>,
            container: 'container',
            browser: 'browser output',
          }}
        />
        <StepLines
          lines={[
            <>
              Step 4: <Mono>docker build -t cloud-docker-demo .</Mono> builds the image
            </>,
            <>
              Step 5: <Mono>docker images</Mono> confirms <Mono>cloud-docker-demo</Mono> stored locally
            </>,
          ]}
        />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ T11-5 */

/** A terminal strip shown full width under its step text, so its text stays readable. */
function StripCard({
  id, step, line, caption, children,
  lesson,
}: { id: string; step: ReactNode; line: ReactNode; caption: ReactNode; children: ReactNode; lesson: string }) {
  return (
    <Card id={id} kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col items-start" style={{ width: BOX_W, gap: 18 }}>
        <StepLabel>{step}</StepLabel>
        <Line>{line}</Line>
        <div className="flex w-full flex-col items-center gap-4" style={{ marginTop: 8 }}>
          {children}
          <ShotCaption>{caption}</ShotCaption>
        </div>
      </div>
    </Card>
  )
}

export function PartB5({ lesson }: { lesson: string }) {
  return (
    <StripCard
      id="T11-5"
      lesson={lesson}
      step="Step 6: Container Started"
      line={
        <>
          Step 6: <Mono>docker run -d --name cloud-web -p 8080:80 cloud-docker-demo</Mono> starts it
        </>
      }
      caption={
        <>
          Terminal after <Mono>docker run</Mono>: <Mono>cloud-web</Mono> container ID printed
        </>
      }
    >
      <Crop name="slide-11-4" crop={[42, 8, 1558, 78]} highlight={[44, 52, 1072, 32]} maxW={BOX_W} maxH={120} alt="Terminal after docker run: cloud-web container ID printed" />
    </StripCard>
  )
}

/* ------------------------------------------------------------------ T11-6 */

export function PartB6({ lesson }: { lesson: string }) {
  return (
    <StripCard
      id="T11-6"
      lesson={lesson}
      step="Step 7: Port Mapping Confirmed"
      line={
        <>
          Step 7: <Mono>docker ps</Mono> expected <Mono>cloud-web</Mono> with <Mono>0.0.0.0:8080-&gt;80/tcp</Mono>
        </>
      }
      caption={
        <>
          <Mono>docker ps</Mono>: <Mono>cloud-web</Mono> mapped to <Mono>0.0.0.0:8080-&gt;80/tcp</Mono>
        </>
      }
    >
      {/* the whole header row and cloud-web row, then the same screenshot enlarged on the PORTS and NAMES columns */}
      <Crop name="slide-11-5" crop={[0, 30, 1600, 51]} maxW={BOX_W} maxH={80} alt="docker ps header row and cloud-web row" />
      <Crop name="slide-11-5" crop={[1060, 30, 540, 51]} highlight={[1064, 56, 534, 24]} maxW={860} maxH={88} alt="docker ps: cloud-web mapped to 0.0.0.0:8080->80/tcp" />
    </StripCard>
  )
}

/* ------------------------------------------------------------------ T11-7 */

export function PartB7({ lesson }: { lesson: string }) {
  return (
    <ShotCard
      id="T11-7"
      kicker={K}
      title={T}
      lesson={lesson}
      step="Step 8: Custom Page Verified"
      lines={['Step 8: browser at port 8080 expected the custom page']}
      caption={
        <>
          Browser at <Mono>localhost:8080</Mono>: the custom “Hello from Docker!” page
        </>
      }
      name="slide-11-6"
      crop={[0, 0, 1000, 350]}
      highlight={[
        [272, 14, 300, 72],
        [4, 152, 628, 90],
      ]}
      maxH={300}
    />
  )
}

/* ------------------------------------------------------------------ T11-8 */

/** Loop: every stop lit, then the container greys out while the image stays lit. Held in the second state on harness URLs. */
export function PartB8({ lesson }: { lesson: string }) {
  const k = useCycle(2, 2600, 1)
  const removed = STILL || k === 1
  const all: StopKey[] = ['file', 'build', 'image', 'run', 'container', 'browser']
  return (
    <Card id="T11-8" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 64 }}>
        <FlowStrip
          lit={all}
          dim={removed ? ['container'] : []}
          labels={{ file: 'Dockerfile', build: 'Build', image: 'Image', run: 'Run', container: 'Container', browser: 'browser output' }}
        />
        <StepLines
          lines={[
            <>
              Step 9: <Mono>docker stop cloud-web</Mono> and <Mono>docker rm cloud-web</Mono> remove it
            </>,
            <>
              Step 10: <Mono>docker images</Mono> still lists <Mono>cloud-docker-demo</Mono> after removal
            </>,
          ]}
        />
      </div>
    </Card>
  )
}

/* STUB (2026-10-28 split): replaced by the section worker. */
