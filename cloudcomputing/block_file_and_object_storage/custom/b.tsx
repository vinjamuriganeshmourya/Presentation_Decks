import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { Arrow, Label, STILL } from '@/decks/figures/scene'
import { NoMark } from '@/decks/figures/net/frames'
import { CvIcon } from '@/decks/figures/net/fx'
import { Diagram } from '@/engine/Diagram'
import { Icon } from '@/engine/icon'
import type { DiagramSpec } from '@/engine/types'
import s3Logo from '../images/aws-s3.svg'
import bucketLogo from '../images/aws-s3-bucket.svg'
import objectLogo from '../images/aws-s3-object.svg'
import ebsLogo from '../images/aws-ebs.svg'
import efsLogo from '../images/aws-efs.svg'

/*
 * BUILDER B · Block, File & Object Storage, sections 3-5 (T11 to T22).
 * Every figure takes the slide's `step` (0 = nothing yet, n = whole) and holds its final frame on `?still`.
 * The part a press brings in is ringed in brand blue for that press only (never on `?still`).
 * Official marks (rule 54) sit in the white tile (radius 0.27 x size, mark 76 %). Labels are DOM text.
 * Styling is inline, the Session 6 way.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const MONO = "'Fira Code', ui-monospace, monospace"
const HEAD = "'DM Sans', system-ui, sans-serif"

/* ------------------------------------------------------------------ shared parts */

function Show({ on, children, style, delay = 0 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(6px)',
        transition: instant ? 'none' : `opacity 360ms ${EASE} ${on ? delay : 0}ms, transform 360ms ${EASE} ${on ? delay : 0}ms`,
        pointerEvents: on ? undefined : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** absolute, centred on (x, y) */
const At = ({ x, y, children, z = 6, style }: { x: number; y: number; children: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z, ...style }}>{children}</div>
)

/** absolute, top-left at (x, y) */
const Box = ({ x, y, w, h, children, z = 4, style }: { x: number; y: number; w?: number; h?: number; children?: ReactNode; z?: number; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, ...style }}>{children}</div>
)

const Frame = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
    <div style={{ position: 'relative', width: w, height: h }}>{children}</div>
  </div>
)

const flex = (gap: number, dir: 'row' | 'column' = 'row', extra: CSSProperties = {}): CSSProperties => ({ display: 'flex', flexDirection: dir, alignItems: 'center', gap, ...extra })
const heading = (size: number, color: string = colors.ink): CSSProperties => ({ fontFamily: HEAD, fontWeight: 600, fontSize: size, lineHeight: 1.25, color })

/** a white card in the deck's tile skin; `lit` rings it in brand blue */
const card = (lit = false, r = 16): CSSProperties => ({
  borderRadius: r,
  ...TILE_SKIN,
  ...(lit ? { boxShadow: `inset 0 0 0 2.5px ${colors.brand}, 0 12px 24px -16px rgba(31,64,140,0.4)` } : {}),
  transition: `box-shadow 360ms ${EASE}`,
})

/** an official mark in its white tile (rule 54) */
function Tile({ src, size }: { src: string; size: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), flexShrink: 0, ...TILE_SKIN }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: Math.round(size * 0.76), height: 'auto', userSelect: 'none' }} />
    </span>
  )
}

/** a lucide icon on the deck's soft tile */
function IconTile({ name, size = 40, tone = colors.brand }: { name: string; size?: number; tone?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), background: colors.surface2, color: tone, flexShrink: 0 }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  )
}

const Mono = ({ children, size = 16, color = colors.ink, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) => (
  <span style={{ fontFamily: MONO, fontSize: size, color, whiteSpace: 'nowrap', fontVariantLigatures: 'none', ...style }}>{children}</span>
)

/** a part is lit for the press that brings it in, never on `?still` */
const litAt = (step: number, k: number) => !STILL && step === k

/** an opaque blob of bytes: a bar of soft cells, no grid lines */
function Blob({ w, h = 22 }: { w: number; h?: number }) {
  const n = Math.floor(w / 14)
  return (
    <span aria-hidden style={{ display: 'flex', gap: 3, width: w, height: h, padding: 3, borderRadius: 8, background: colors.surface2, overflow: 'hidden' }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ flex: 1, borderRadius: 3, background: colors.brand, opacity: 0.18 + ((i * 37) % 50) / 100 }} />
      ))}
    </span>
  )
}

/** a small elbow connector with a head, for paths the scene `Arrow` cannot draw (straight only) */
function Elbow({ pts, on, tone = colors.brand, dashed = false }: { pts: [number, number][]; on: boolean; tone?: string; dashed?: boolean }) {
  const instant = useInstant()
  const [ax, ay] = pts[pts.length - 2]
  const [bx, by] = pts[pts.length - 1]
  const a = Math.atan2(by - ay, bx - ax)
  const H = 9
  const ex = bx - Math.cos(a) * H
  const ey = by - Math.sin(a) * H
  const line = [...pts.slice(0, -1), [ex, ey] as [number, number]]
  const d = line.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ')
  const l = { x: bx - Math.cos(a) * H + Math.cos(a + Math.PI / 2) * 5, y: by - Math.sin(a) * H + Math.sin(a + Math.PI / 2) * 5 }
  const r = { x: bx - Math.cos(a) * H - Math.cos(a + Math.PI / 2) * 5, y: by - Math.sin(a) * H - Math.sin(a + Math.PI / 2) * 5 }
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: 0, top: 0, overflow: 'visible', zIndex: 3, opacity: on ? 1 : 0, transition: instant ? 'none' : `opacity 420ms ${EASE}` }} width={1} height={1}>
      <path d={d} stroke={tone} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dashed ? '7 7' : undefined} className={dashed ? 'mo mo-dash' : undefined} />
      <path d={`M ${bx} ${by} L ${l.x} ${l.y} L ${r.x} ${r.y} Z`} fill={tone} />
    </svg>
  )
}

/* ───────────────────────── T11 · the bucket, its objects, their keys ───────────────────────── */

const KEYS = ['session7-object.txt', 'photos/2024/a.jpg', 'photos/2024/b.jpg']

function BucketHead({ right, region = true }: { right?: ReactNode; region?: boolean }) {
  return (
    <div style={{ ...flex(12), justifyContent: 'space-between', width: '100%' }}>
      <span style={flex(12)}>
        <Tile src={bucketLogo} size={46} />
        <span style={heading(18)}>Bucket</span>
        {region && (
          <Label mono tone="brand" icon={<Icon name="MapPin" size={14} />}>
            ap-south-1
          </Label>
        )}
      </span>
      {right}
    </div>
  )
}

function B_T11({ step }: { step: number }) {
  return (
    <Frame w={586} h={340}>
      <Show on={step >= 1} style={{ position: 'absolute', left: 10, top: 8, width: 566, height: 324 }}>
        <div style={{ ...card(litAt(step, 1)), position: 'absolute', inset: 0, padding: '16px 18px' }}>
          <BucketHead
            right={
              <Show on={step >= 3}>
                <Label strong tone="brand" icon={<Icon name="KeyRound" size={14} />}>
                  Unique Inside Its Bucket
                </Label>
              </Show>
            }
          />
          {/* what a bucket sets */}
          <div style={{ ...flex(8), marginTop: 14 }}>
            <Label icon={<Icon name="MapPin" size={14} />}>Region</Label>
            <Label icon={<Icon name="ShieldCheck" size={14} />}>Access</Label>
            <Label icon={<Icon name="RefreshCw" size={14} />}>Lifecycle Rules</Label>
          </div>
          {/* the objects it holds */}
          <div style={{ ...flex(10, 'column', { alignItems: 'stretch' }), marginTop: 16 }}>
            {KEYS.map((k, i) => (
              <Show key={k} on={step >= 2} delay={i * 120}>
                <div style={{ ...flex(12), height: 52, padding: '0 14px', borderRadius: 12, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                  <img src={objectLogo} alt="" aria-hidden draggable={false} style={{ width: 28, height: 'auto' }} />
                  <span style={{ width: 210, display: 'flex' }}>
                    <Show on={step >= 3} delay={i * 120}>
                      <Mono size={16} color={colors.brandDark}>
                        {k}
                      </Mono>
                    </Show>
                  </span>
                  <Blob w={120} />
                  <Label tone="muted" icon={<Icon name="Tags" size={14} />}>
                    Metadata
                  </Label>
                </div>
              </Show>
            ))}
          </div>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T11-B · metadata beside the data; the flat namespace ───────────────────────── */

function TreeRow({ depth, name, folder }: { depth: number; name: string; folder?: boolean }) {
  return (
    <div style={{ ...flex(8), height: 30, paddingLeft: depth * 24 }}>
      {depth > 0 && <span aria-hidden style={{ width: 12, height: 2, background: colors.line, marginLeft: -16 }} />}
      <Icon name={folder ? 'Folder' : 'File'} size={17} style={{ color: folder ? colors.brand : colors.muted }} />
      <Mono size={15}>{name}</Mono>
    </div>
  )
}

function B_T11B({ step }: { step: number }) {
  const rows = KEYS.slice(0, 2)
  return (
    <Frame w={586} h={400}>
      {/* the bucket, two objects, each with its metadata kept beside the data */}
      <div style={{ ...card(litAt(step, 1)), position: 'absolute', left: 6, top: 6, width: 574, height: 192, padding: '14px 16px', boxSizing: 'border-box' }}>
        <BucketHead
          region={false}
          right={
            <Show on={step >= 1}>
              <span style={flex(8)}>
                <Label strong tone="brand" icon={<Icon name="Tags" size={14} />}>
                  Metadata
                </Label>
                <Label>Kept Separate From The Data</Label>
              </span>
            </Show>
          }
        />
        <div style={{ ...flex(10, 'column', { alignItems: 'stretch' }), marginTop: 14 }}>
          {rows.map((k, i) => (
            <div key={k} style={{ ...flex(12), height: 50, padding: '0 12px', borderRadius: 12, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
              <img src={objectLogo} alt="" aria-hidden draggable={false} style={{ width: 26, height: 'auto' }} />
              <span style={{ width: 178 }}>
                <Mono size={15} color={colors.brandDark}>
                  {k}
                </Mono>
              </span>
              <Blob w={72} />
              <span aria-hidden style={{ width: 1, height: 30, background: colors.line }} />
              <Show on={step >= 1} delay={i * 140}>
                <span style={flex(6)}>
                  <Label tone="brand">Content Type</Label>
                  <Label tone="brand">Size</Label>
                </span>
              </Show>
            </div>
          ))}
        </div>
      </div>

      {/* no folder tree: every key at one level */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 6, top: 214, width: 262, height: 180 }}>
        <div style={{ ...card(), position: 'absolute', inset: 0, padding: '12px 16px', opacity: 0.92 }}>
          <span style={flex(8)}>
            <Icon name="FolderTree" size={18} style={{ color: colors.muted }} />
            <span style={heading(16, colors.muted)}>Folder Tree</span>
          </span>
          <div style={{ marginTop: 10 }}>
            <TreeRow depth={0} name="photos/" folder />
            <TreeRow depth={1} name="2024/" folder />
            <TreeRow depth={2} name="a.jpg" />
            <TreeRow depth={0} name="session7-object.txt" />
          </div>
        </div>
        <At x={236} y={30} z={8}>
          <NoMark size={30} on={step >= 2} />
        </At>
      </Show>
      <Show on={step >= 2} delay={200} style={{ position: 'absolute', left: 280, top: 214, width: 300, height: 180 }}>
        <div style={{ ...card(litAt(step, 2)), position: 'absolute', inset: 0, padding: '12px 16px' }}>
          <span style={{ ...flex(8), justifyContent: 'space-between' }}>
            <span style={flex(8)}>
              <Icon name="Rows3" size={18} style={{ color: colors.brand }} />
              <span style={heading(16)}>Flat Namespace</span>
            </span>
            <Label tone="brand">One Level</Label>
          </span>
          <div style={{ ...flex(8, 'column', { alignItems: 'stretch' }), marginTop: 12 }}>
            {[...rows, KEYS[2]].map((k) => (
              <div key={k} style={{ ...flex(8), height: 32, padding: '0 10px', borderRadius: 9, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                <img src={objectLogo} alt="" aria-hidden draggable={false} style={{ width: 18, height: 'auto' }} />
                <Mono size={15}>{k}</Mono>
              </div>
            ))}
          </div>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T12 · one object: data, key, metadata ───────────────────────── */

function Part({ title, icon, lit, children, h }: { title: string; icon: string; lit: boolean; children: ReactNode; h: number }) {
  return (
    <div style={{ ...card(lit, 14), height: h, padding: '12px 14px', boxSizing: 'border-box' }}>
      <span style={flex(8)}>
        <IconTile name={icon} size={30} />
        <span style={heading(16)}>{title}</span>
      </span>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  )
}

const Field = ({ k, v }: { k: string; v: string }) => (
  <div style={{ ...flex(10), height: 24 }}>
    <span style={{ width: 104, fontSize: 14, color: colors.muted, fontWeight: 500 }}>{k}</span>
    <Mono size={14}>{v}</Mono>
  </div>
)

function B_T12({ step }: { step: number }) {
  return (
    <Frame w={586} h={330}>
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 4, width: 574, height: 322 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: colors.surface, boxShadow: `inset 0 0 0 1.5px ${colors.brand}` }} />
        <Box x={16} y={12}>
          <span style={flex(10)}>
            <Tile src={objectLogo} size={34} />
            <span style={heading(17)}>One Object</span>
          </span>
        </Box>
        <Box x={16} y={54} w={266}>
          <Part title="Data" icon="Binary" lit={litAt(step, 1)} h={84}>
            <span style={flex(10)}>
              <Blob w={120} />
              <Label tone="muted">Opaque Blob</Label>
            </span>
          </Part>
        </Box>
        <Box x={292} y={54} w={266}>
          <Show on={step >= 2}>
            <Part title="Key" icon="KeyRound" lit={litAt(step, 2)} h={84}>
              <Mono size={16} color={colors.brandDark}>
                session7-object.txt
              </Mono>
            </Part>
          </Show>
        </Box>
        <Box x={16} y={146} w={266}>
          <Show on={step >= 3}>
            <Part title="System Metadata" icon="Settings" lit={litAt(step, 3)} h={166}>
              <Field k="Content Type" v="text/plain" />
              <Field k="Size" v="68.0 B" />
              <Field k="Last Modified" v="October 15, 2026" />
              <div style={{ marginTop: 6 }}>
                <Label tone="brand" icon={<Icon name="RefreshCw" size={14} />}>
                  Maintained Automatically
                </Label>
              </div>
            </Part>
          </Show>
        </Box>
        <Box x={292} y={146} w={266}>
          <Show on={step >= 4}>
            <Part title="User Metadata" icon="Tags" lit={litAt(step, 4)} h={166}>
              <div style={{ ...flex(8), height: 46, padding: '0 10px', borderRadius: 10, border: `1.5px dashed ${colors.line}` }}>
                <Label>Key</Label>
                <Icon name="ArrowRight" size={16} style={{ color: colors.muted }} />
                <Label>Value</Label>
              </div>
              <div style={{ marginTop: 14 }}>
                <Label tone="brand" icon={<Icon name="AppWindow" size={14} />}>
                  Custom Key-Value Pairs
                </Label>
              </div>
            </Part>
          </Show>
        </Box>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T13 · a globally unique, region-pinned bucket ───────────────────────── */

const BUCKET = 's7-object-storage-kj-2026-5831'

function B_T13({ step }: { step: number }) {
  return (
    <Frame w={586} h={330}>
      {/* Account A owns the name */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 4, width: 574, height: 166 }}>
        <div style={{ ...card(litAt(step, 1)), position: 'absolute', inset: 0, padding: '12px 16px' }}>
          <span style={{ ...flex(8), justifyContent: 'space-between' }}>
            <Label strong icon={<Icon name="CircleUser" size={14} />}>
              Account A
            </Label>
            <Label strong tone="good" icon={<Icon name="Globe" size={14} />}>
              Globally Unique Name
            </Label>
          </span>
          <div style={{ ...flex(14), marginTop: 12 }}>
            <Tile src={bucketLogo} size={50} />
            <span style={flex(6, 'column', { alignItems: 'flex-start' })}>
              <Mono size={17} color={colors.brandDark}>
                {BUCKET}
              </Mono>
              <span style={flex(8)}>
                <Label mono tone="brand" icon={<Icon name="MapPin" size={14} />}>
                  ap-south-1
                </Label>
                <Show on={step >= 3}>
                  <Label tone={litAt(step, 3) ? 'solid' : 'plain'} icon={<Icon name="Lock" size={14} />}>
                    Stays In Its Chosen AWS Region
                  </Label>
                </Show>
              </span>
            </span>
          </div>
          {/* unlimited objects */}
          <Show on={step >= 4} style={{ ...flex(10), marginTop: 12 }}>
            <span style={flex(4)}>
              {Array.from({ length: 6 }, (_, i) => (
                <img key={i} src={objectLogo} alt="" aria-hidden draggable={false} style={{ width: 22, height: 'auto', opacity: 1 - i * 0.12 }} />
              ))}
            </span>
            <Label tone={litAt(step, 4) ? 'solid' : 'brand'} icon={<Icon name="Infinity" size={14} />}>
              Unlimited Objects
            </Label>
            <Label>No Folder Limit</Label>
          </Show>
        </div>
      </Show>

      {/* the naming rules, under the name */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 6, top: 182, width: 574, ...flex(8, 'row', { justifyContent: 'center' }) }}>
        {['Lowercase Letters', 'Numbers', 'Hyphens', '3 To 63 Characters'].map((t) => (
          <Label key={t} tone={litAt(step, 2) ? 'solid' : 'brand'} strong={t.startsWith('3')}>
            {t}
          </Label>
        ))}
      </Show>

      {/* Account B cannot take the same name */}
      <Show on={step >= 1} delay={300} style={{ position: 'absolute', left: 6, top: 222, width: 574, height: 104 }}>
        <div style={{ ...card(), position: 'absolute', inset: 0, padding: '12px 16px' }}>
          <Label strong icon={<Icon name="CircleUser" size={14} />}>
            Account B
          </Label>
          <div style={{ ...flex(14), marginTop: 10 }}>
            <span style={{ opacity: 0.45 }}>
              <Tile src={bucketLogo} size={40} />
            </span>
            <Mono size={17} color={colors.muted} style={{ textDecoration: 'line-through', textDecorationColor: colors.danger, textDecorationThickness: 2 }}>
              {BUCKET}
            </Mono>
            <NoMark size={26} on={step >= 1} />
            <Label tone="bad" strong>
              Same Name
            </Label>
          </div>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T14 · a folder tree vs flat keys ───────────────────────── */

const TREE: { d: number; n: string; f?: boolean }[] = [
  { d: 0, n: 'photos/', f: true },
  { d: 1, n: '2024/', f: true },
  { d: 2, n: 'a.jpg' },
  { d: 2, n: 'b.jpg' },
  { d: 1, n: '2025/', f: true },
  { d: 2, n: 'c.jpg' },
]
const FLAT = [
  ['photos/2024/', 'a.jpg'],
  ['photos/2024/', 'b.jpg'],
  ['photos/2025/', 'c.jpg'],
]

function B_T14({ step }: { step: number }) {
  const grouped = step >= 3
  return (
    <Frame w={1000} h={340}>
      {/* left: the hierarchical file system */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 20, top: 8, width: 420, height: 324 }}>
        <div style={{ ...card(litAt(step, 1)), position: 'absolute', inset: 0, padding: '16px 22px' }}>
          <span style={flex(10)}>
            <IconTile name="FolderTree" size={34} />
            <span style={heading(18)}>Hierarchical File System</span>
          </span>
          <div style={{ position: 'relative', marginTop: 14 }}>
            {/* the tree's spines */}
            <span aria-hidden style={{ position: 'absolute', left: 9, top: 30, width: 2, height: 150, background: colors.line }} />
            <span aria-hidden style={{ position: 'absolute', left: 33, top: 60, width: 2, height: 60, background: colors.line }} />
            <span aria-hidden style={{ position: 'absolute', left: 33, top: 150, width: 2, height: 30, background: colors.line }} />
            {TREE.map((r, i) => (
              <div key={i} style={{ ...flex(10), height: 40, paddingLeft: r.d * 24 + (r.d ? 10 : 0) }}>
                {r.d > 0 && <span aria-hidden style={{ width: 12, height: 2, background: colors.line, marginLeft: -12 }} />}
                <Icon name={r.f ? 'Folder' : 'File'} size={20} style={{ color: r.f ? colors.brand : colors.muted, flexShrink: 0 }} />
                <Mono size={17}>{r.n}</Mono>
              </div>
            ))}
          </div>
        </div>
      </Show>

      {/* right: the flat object namespace */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 470, top: 8, width: 510, height: 324 }}>
        <div style={{ ...card(litAt(step, 2)), position: 'absolute', inset: 0, padding: '16px 22px' }}>
          <span style={flex(10)}>
            <Tile src={bucketLogo} size={34} />
            <span style={heading(18)}>Flat Object Namespace</span>
          </span>
          <div style={{ ...flex(12, 'column', { alignItems: 'flex-start' }), marginTop: 18 }}>
            {FLAT.map(([p, f], i) => (
              <div key={i} style={{ ...flex(10), width: 280, height: 42, padding: '0 14px', borderRadius: 11, background: colors.white, boxShadow: `inset 0 0 0 1px ${colors.line}` }}>
                <img src={objectLogo} alt="" aria-hidden draggable={false} style={{ width: 20, height: 'auto' }} />
                <Mono size={17}>
                  <span style={{ color: grouped && i < 2 ? colors.brand : colors.ink, fontWeight: grouped && i < 2 ? 600 : 400, transition: `color 360ms ${EASE}` }}>{p}</span>
                  {f}
                </Mono>
              </div>
            ))}
          </div>
          {/* the console's folder view, made by splitting keys on the slash */}
          <Show on={grouped} delay={260} style={{ ...flex(10), marginTop: 20 }}>
            <Label strong icon={<Icon name="Monitor" size={14} />}>
              Console Folder View
            </Label>
            <Label mono tone="brand" icon={<Icon name="Folder" size={14} />}>
              photos/
            </Label>
            <Icon name="ChevronRight" size={16} style={{ color: colors.muted }} />
            <Label mono tone="brand" icon={<Icon name="Folder" size={14} />}>
              2024/
            </Label>
          </Show>
        </div>
        {/* the dashed group around the keys that share a prefix */}
        <Show on={grouped} style={{ position: 'absolute', left: 304, top: 60, width: 30, height: 104 }}>
          <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 96, borderRadius: '0 12px 12px 0', border: `2px dashed ${colors.brand}`, borderLeft: 'none' }} />
        </Show>
        <At x={404} y={108} z={7}>
          <Show on={grouped}>
            <Label strong tone={litAt(step, 3) ? 'solid' : 'brand'}>
              Shared Prefix
            </Label>
          </Show>
        </At>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T16 · one HTTP request, three mechanisms ───────────────────────── */

const MECH: DiagramSpec = {
  type: 'diagram',
  w: 546,
  h: 340,
  nodes: [
    { id: 'c', x: 56, y: 170, icon: 'lib:build-boy-laptop', shape: 'bare', size: 92, label: 'Client' },
    { id: 's3', x: 300, y: 170, icon: `img:${s3Logo}`, shape: 'tile', size: 60, label: 'S3 Endpoint', loop: 'ripple' },
    { id: 'rest', x: 448, y: 44, icon: 'Globe', shape: 'tile', size: 48, label: 'REST Call' },
    { id: 'pre', x: 448, y: 160, icon: 'Link', shape: 'tile', size: 48, label: 'Presigned Link' },
    { id: 'ver', x: 448, y: 276, icon: 'Layers', shape: 'tile', size: 48, label: 'Versioned Object Stack' },
  ],
  arrows: [
    { from: 'c', to: 's3', label: 'HTTP Request', labelPos: 'above' },
    { from: 's3', to: 'rest' },
    { from: 's3', to: 'pre' },
    { from: 's3', to: 'ver' },
  ],
  packets: [
    { path: ['c', 's3', 'rest'], dur: 3 },
    { path: ['c', 's3', 'pre'], dur: 3 },
    { path: ['c', 's3', 'ver'], dur: 3 },
  ],
  steps: [
    { show: ['c', 's3', 'c>s3', 'rest', 's3>rest', 'packet:0'], lit: ['rest'] },
    { show: ['pre', 's3>pre', 'packet:1'], lit: ['pre'] },
    { show: ['ver', 's3>ver', 'packet:2'], lit: ['ver'] },
  ],
}

function B_T16({ step }: { step: number }) {
  return (
    <Frame w={546} h={340}>
      <Diagram spec={MECH} step={step} />
    </Frame>
  )
}

/* ───────────────────────── T17 · the request line: verb, path, signature ───────────────────────── */

const VERBS: [string, string][] = [
  ['GET', 'Retrieves'],
  ['PUT', 'Uploads Or Overwrites'],
  ['DELETE', 'Removes'],
]

const Verb = ({ v, solid = false }: { v: string; solid?: boolean }) => (
  <span style={{ display: 'inline-grid', placeItems: 'center', minWidth: 72, height: 28, padding: '0 8px', borderRadius: 8, fontFamily: MONO, fontSize: 15, fontWeight: 600, background: solid ? colors.brand : colors.surface2, color: solid ? colors.white : colors.brandDark }}>{v}</span>
)

function B_T17({ step }: { step: number }) {
  const lit3 = step >= 3
  const path = (t: string) => <span style={{ color: lit3 ? colors.brand : colors.ink, fontWeight: lit3 ? 600 : 400, transition: `color 360ms ${EASE}` }}>{t}</span>
  return (
    <Frame w={586} h={330}>
      {/* the request: the verb and the path on line 1, the signed header on line 2 */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 4, width: 574, height: 112 }}>
        <div style={{ ...card(), position: 'absolute', inset: 0 }}>
          <Box x={18} y={12}>
            <Label strong icon={<Icon name="Send" size={14} />}>
              HTTP Request
            </Label>
          </Box>
          <Box x={18} y={46}>
            <Verb v="GET" solid />
          </Box>
          <Box x={104} y={48}>
            <Mono size={18}>
              {path('/bucket-name')}
              {path('/object-key')}
            </Mono>
          </Box>
          <Box x={104} y={80}>
            <span style={flex(10)}>
              <Mono size={16} color={colors.muted}>
                Authorization
              </Mono>
              <Show on={step >= 2}>
                <Label strong tone={litAt(step, 2) ? 'solid' : 'brand'} icon={<Icon name="Signature" size={14} />}>
                  Signature Version 4
                </Label>
              </Show>
            </span>
          </Box>
        </div>
      </Show>

      {/* verb → its action */}
      <Arrow x1={54} y1={120} x2={54} y2={150} on={step >= 1} />
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 154, width: 290, height: 110 }}>
        <div style={{ ...card(litAt(step, 1), 14), position: 'absolute', inset: 0, padding: '10px 14px', ...flex(6, 'column', { alignItems: 'flex-start', justifyContent: 'center' }) }}>
          {VERBS.map(([v, a]) => (
            <span key={v} style={flex(10)}>
              <Verb v={v} />
              <span style={{ fontSize: 15, fontWeight: 500, color: colors.ink, whiteSpace: 'nowrap' }}>{a}</span>
            </span>
          ))}
        </div>
      </Show>

      {/* path → the bucket and the object it names; the lines leave from the card's foot */}
      <Arrow x1={190} y1={120} x2={366} y2={150} on={lit3} />
      <Arrow x1={300} y1={120} x2={500} y2={150} on={lit3} />
      <Show on={lit3} style={{ position: 'absolute', left: 308, top: 154, width: 272, height: 110 }}>
        <div style={{ ...card(litAt(step, 3), 14), position: 'absolute', inset: 0, ...flex(10, 'row', { justifyContent: 'space-around' }) }}>
          <span style={flex(8, 'column')}>
            <Tile src={bucketLogo} size={44} />
            <Label strong>Bucket Name</Label>
          </span>
          <span style={flex(8, 'column')}>
            <Tile src={objectLogo} size={44} />
            <Label strong>Object Key</Label>
          </span>
        </div>
      </Show>

      {/* an unsigned request is refused */}
      <Show on={step >= 4} style={{ position: 'absolute', left: 6, top: 276, width: 574, height: 50 }}>
        <div style={{ ...card(litAt(step, 4), 14), position: 'absolute', inset: 0, ...flex(12, 'row', { justifyContent: 'center' }) }}>
          <NoMark size={26} on={step >= 4} />
          <Label>Unsigned Request</Label>
          <Icon name="ArrowRight" size={18} style={{ color: colors.muted }} />
          <Tile src={s3Logo} size={34} />
          <Icon name="ArrowRight" size={18} style={{ color: colors.muted }} />
          <Label strong tone="bad" icon={<Icon name="Ban" size={14} />}>
            HTTP 403
          </Label>
        </div>
      </Show>
    </Frame>
  )
}

/* ───────────────────────── T18 · the presigned URL: what it is signed from, who checks it, its window ───────────────────────── */
/* matched to the reference build (2026-11-17): three bands; the signed link, the app reaching S3 directly, the window on a timeline */

const T0 = 40
const TX = 330
const TEND = 486
const TRACK_Y = 274

/** one input of the signature: an icon tile over its name */
const SigPart = ({ icon, text }: { icon: string; text: string }) => (
  <span style={flex(6, 'column')}>
    <IconTile name={icon} size={36} />
    <span style={{ fontSize: 13, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap' }}>{text}</span>
  </span>
)

function B_T18({ step }: { step: number }) {
  const held = useInstant()
  const fade = (delay = 0) => (held ? 'none' : `opacity 360ms ${EASE} ${delay}ms`)
  return (
    <Frame w={526} h={330}>
      {/* what the signature is computed from, and the signed link it makes */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 6, top: 6, width: 514, height: 80 }}>
        <div style={{ ...card(litAt(step, 1), 14), position: 'absolute', inset: 0 }} />
        <Box x={22} y={10}>
          <span style={flex(12, 'row', { alignItems: 'flex-start' })}>
            <SigPart icon="KeyRound" text="Owner Credentials" />
            <Icon name="Plus" size={14} style={{ color: colors.muted, marginTop: 11 }} />
            <SigPart icon="File" text="Object Key" />
            <Icon name="Plus" size={14} style={{ color: colors.muted, marginTop: 11 }} />
            <SigPart icon="Timer" text="Expiry" />
          </span>
        </Box>
        <Arrow x1={330} y1={34} x2={372} y2={34} on={step >= 1} />
        <At x={438} y={34}>
          <Label strong tone="solid" icon={<Icon name="Signature" size={14} />}>
            Signed Link
          </Label>
        </At>
      </Show>

      {/* the app reaches S3 directly; no app server in between */}
      <Show on={step >= 2} style={{ position: 'absolute', left: 6, top: 98, width: 514, height: 112 }}>
        <div style={{ ...card(litAt(step, 3), 14), position: 'absolute', inset: 0 }} />
      </Show>
      <At x={96} y={144} z={6}>
        <Show on={step >= 3}>
          <CvIcon name="laptop" w={60} />
        </Show>
      </At>
      <At x={96} y={192} z={6}>
        <Show on={step >= 3}>
          <Label strong>Browser Or Mobile App</Label>
        </Show>
      </At>
      <Arrow x1={140} y1={150} x2={398} y2={150} on={step >= 3} both />
      <At x={269} y={126} z={6}>
        <Show on={step >= 3}>
          <span style={{ position: 'relative', display: 'inline-grid' }}>
            <IconTile name="Server" size={34} tone={colors.muted} />
            <span style={{ position: 'absolute', right: -8, top: -8 }}>
              <NoMark size={18} on={step >= 3} />
            </span>
          </span>
        </Show>
      </At>
      <At x={269} y={176} z={6}>
        <Show on={step >= 3}>
          <Label tone={litAt(step, 3) ? 'solid' : 'plain'}>Upload Or Download</Label>
        </Show>
      </At>
      <At x={440} y={146} z={6}>
        <Show on={step >= 2}>
          <span style={{ position: 'relative', display: 'inline-grid' }}>
            <Tile src={s3Logo} size={56} />
            <span style={{ position: 'absolute', right: -10, top: -10, display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 13, background: colors.success, color: colors.white, boxShadow: `0 0 0 3px ${colors.white}` }}>
              <Icon name="ShieldCheck" size={15} />
            </span>
          </span>
        </Show>
      </At>
      <At x={440} y={192} z={6}>
        <Show on={step >= 2}>
          <Label strong>S3</Label>
        </Show>
      </At>

      {/* the timeline: generated, the valid window, expiry, then denied */}
      <Show on={step >= 1} delay={200} style={{ position: 'absolute', left: 6, top: 222, width: 514, height: 104 }}>
        <div style={{ ...card(litAt(step, 2) || litAt(step, 4), 14), position: 'absolute', inset: 0 }} />
      </Show>
      <Show on={step >= 1} delay={260} style={{ position: 'absolute', inset: 0 }}>
        <span aria-hidden style={{ position: 'absolute', left: T0, top: TRACK_Y - 6, width: TX - T0, height: 12, borderRadius: 6, background: colors.success }} />
        <span aria-hidden style={{ position: 'absolute', left: T0 - 6, top: TRACK_Y - 6, width: 12, height: 12, borderRadius: 6, background: colors.brand, boxShadow: `0 0 0 3px ${colors.white}` }} />
        <span aria-hidden style={{ position: 'absolute', left: TX - 1.5, top: TRACK_Y - 14, width: 3, height: 28, borderRadius: 2, background: colors.danger }} />
        <Box x={T0 - 6} y={TRACK_Y + 14}>
          <Label tone="brand" icon={<Icon name="Link" size={14} />}>
            Generated
          </Label>
        </Box>
        <At x={TX} y={TRACK_Y - 28} z={7}>
          <Label tone="bad" icon={<Icon name="Timer" size={14} />}>
            Expiry
          </Label>
        </At>
      </Show>
      <span aria-hidden style={{ position: 'absolute', left: TX + 3, top: TRACK_Y - 6, width: TEND - TX - 3, height: 12, borderRadius: 6, background: 'rgba(239,68,68,0.22)', opacity: step >= 2 ? 1 : 0, transition: fade() }} />
      <At x={(TX + TEND) / 2} y={TRACK_Y} z={8}>
        <NoMark size={26} on={step >= 2} />
      </At>
      <At x={(TX + TEND) / 2} y={TRACK_Y + 30} z={7}>
        <Show on={step >= 2}>
          <Label strong tone="bad">
            Access Denied
          </Label>
        </Show>
      </At>
      <At x={(T0 + TX) / 2 - 24} y={TRACK_Y - 28} z={7}>
        <Show on={step >= 4}>
          <Label tone={litAt(step, 4) ? 'solid' : 'good'} icon={<Icon name="CalendarClock" size={14} />}>
            Minutes To Several Days
          </Label>
        </Show>
      </At>
    </Frame>
  )
}

/* ───────────────────────── T19 · the version stack under one key ───────────────────────── */
/* matched to the reference build (2026-11-17): restoring writes v2 back on top as the new current version, and the GET follows it */

const SX = 126
const SW = 334
const BH = 42
const ROW = (i: number) => 18 + i * 52 // 0 restored, 1 marker, 2 v3, 3 v2, 4 v1

function Version({ label, sub, tone = 'plain', current = false, dashed = false, lit = false }: { label: string; sub?: string; tone?: 'plain' | 'marker' | 'restored'; current?: boolean; dashed?: boolean; lit?: boolean }) {
  const bg = tone === 'marker' ? 'rgba(239,68,68,0.08)' : tone === 'restored' ? colors.surface2 : colors.white
  const ring = lit ? colors.brand : tone === 'marker' ? 'rgba(239,68,68,0.55)' : current ? colors.brand : colors.line
  return (
    <div style={{ ...flex(10), justifyContent: 'space-between', width: SW, height: BH, padding: '0 12px', boxSizing: 'border-box', borderRadius: 11, background: bg, boxShadow: dashed ? undefined : `inset 0 0 0 ${lit || current ? 2 : 1.5}px ${ring}`, border: dashed ? `2px dashed ${colors.brand}` : undefined, transition: `box-shadow 360ms ${EASE}` }}>
      <span style={flex(8)}>
        <Icon name={tone === 'marker' ? 'Bookmark' : 'File'} size={17} style={{ color: tone === 'marker' ? colors.danger : colors.brand }} />
        <span style={heading(15)}>{label}</span>
      </span>
      {sub && <Mono size={13} color={colors.muted}>{sub}</Mono>}
    </div>
  )
}

function B_T19({ step }: { step: number }) {
  const getOn = step >= 1
  /* the GET reads whichever version is current: v3, then the restored v2 on top */
  const getY = step >= 3 ? ROW(0) : ROW(2)
  const move = `top 520ms ${EASE}`
  return (
    <Frame w={566} h={330}>
      <Box x={SX} y={ROW(2)}>
        <Show on={step >= 1}>
          <Version label="v3" sub="Version ID" current={step < 2} lit={litAt(step, 1)} />
        </Show>
      </Box>
      <Box x={SX} y={ROW(3)}>
        <Show on={step >= 1} delay={120}>
          <Version label="v2" sub="Version ID" lit={litAt(step, 3)} />
        </Show>
      </Box>
      <Box x={SX} y={ROW(4)}>
        <Show on={step >= 1} delay={240}>
          <Version label="v1" sub="Version ID" />
        </Show>
      </Box>
      <Box x={SX} y={ROW(1)}>
        <Show on={step >= 2}>
          <Version label="Delete Marker" tone="marker" lit={litAt(step, 2)} />
        </Show>
      </Box>
      <Box x={SX} y={ROW(0)}>
        <Show on={step >= 3}>
          <Version label="v2 (Restored, Current)" sub="New Version ID" tone="restored" dashed />
        </Show>
      </Box>
      {/* the one key underneath them all */}
      <Box x={SX} y={276} w={SW} h={44}>
        <Show on={step >= 1} style={{ ...flex(8, 'row', { justifyContent: 'center' }), height: 44, borderRadius: 12, background: colors.surface, boxShadow: `inset 0 0 0 1.5px ${colors.line}` }}>
          <Icon name="KeyRound" size={16} style={{ color: colors.brand }} />
          <Mono size={15} color={colors.brandDark}>
            session7-object.txt
          </Mono>
        </Show>
      </Box>

      {/* a GET with no version ID reads the current version */}
      <Box x={6} y={getY + 6} z={6} style={{ transition: move }}>
        <Show on={getOn} style={{ opacity: step === 2 && !STILL ? 0.45 : 1, transition: `opacity 360ms ${EASE}` }}>
          <Verb v="GET" solid />
        </Show>
      </Box>
      <Box x={0} y={getY + 21 - 10} w={SX} h={20} z={5} style={{ transition: move }}>
        <Arrow x1={86} y1={10} x2={SX - 4} y2={10} on={getOn} />
      </Box>
      <Box x={6} y={getY + 46} z={6} style={{ transition: move }}>
        <Show on={getOn}>
          <Label tone="muted">No Version ID</Label>
        </Show>
      </Box>

      {/* restoring v2 by its version ID */}
      <Elbow pts={[[SX + SW + 4, ROW(3) + 21], [SX + SW + 54, ROW(3) + 21], [SX + SW + 54, ROW(0) + 21], [SX + SW + 4, ROW(0) + 21]]} on={step >= 3} />
      <At x={SX + SW + 54} y={(ROW(0) + ROW(3)) / 2 + 21} z={6}>
        <Show on={step >= 3}>
          <Label strong tone={litAt(step, 3) ? 'solid' : 'brand'} icon={<Icon name="RotateCcw" size={14} />}>
            Restore
          </Label>
        </Show>
      </At>

      {/* every version is billed */}
      <Box x={6} y={226} w={112} z={6}>
        <Show on={step >= 4}>
          <div style={{ ...card(litAt(step, 4), 14), padding: '10px 12px' }}>
            <span style={flex(8, 'column')}>
              <IconTile name="Tag" size={30} tone={colors.accentDark} />
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, color: colors.ink, textAlign: 'center' }}>Each Overwrite Billed Separately</span>
            </span>
          </div>
        </Show>
      </Box>
    </Frame>
  )
}

/* ───────────────────────── T20 · four dimensions, the family each weighs ───────────────────────── */

const DIMS: { t: string; icon: string; logo: string; fam: string }[] = [
  { t: 'Performance', icon: 'Gauge', logo: ebsLogo, fam: 'Block (EBS)' },
  { t: 'Sharing', icon: 'Share2', logo: efsLogo, fam: 'File (EFS)' },
  { t: 'Scale', icon: 'Maximize2', logo: s3Logo, fam: 'Object (S3)' },
  { t: 'Cost', icon: 'Wallet', logo: s3Logo, fam: 'Object (S3)' },
]

function B_T20({ step }: { step: number }) {
  const CW = 272
  const CH = 160
  return (
    <Frame w={566} h={340}>
      {DIMS.map((d, i) => {
        const x = 6 + (i % 2) * (CW + 10)
        const y = 6 + Math.floor(i / 2) * (CH + 10)
        const on = step >= i + 1
        return (
          <Show key={d.t} on={on} style={{ position: 'absolute', left: x, top: y, width: CW, height: CH }}>
            <div style={{ ...card(litAt(step, i + 1)), position: 'absolute', inset: 0 }} />
            <Box x={18} y={14}>
              <span style={heading(18)}>{d.t}</span>
            </Box>
            <At x={66} y={94}>
              <IconTile name={d.icon} size={54} />
            </At>
            <Arrow x1={100} y1={94} x2={164} y2={94} on={on} />
            <At x={200} y={88}>
              <Tile src={d.logo} size={56} />
            </At>
            <At x={200} y={138}>
              <Label strong tone="brand">
                {d.fam}
              </Label>
            </At>
          </Show>
        )
      })}
    </Frame>
  )
}

/* ───────────────────────── T22 · the access pattern decides ───────────────────────── */

const FAMS: { t: string; svc: string; logo: string; ex: string; at: number }[] = [
  { t: 'Block', svc: 'Amazon EBS', logo: ebsLogo, ex: "A Database's Data Files", at: 2 },
  { t: 'File', svc: 'Amazon EFS', logo: efsLogo, ex: 'A Shared Config Directory', at: 3 },
  { t: 'Object', svc: 'Amazon S3', logo: s3Logo, ex: 'User-Uploaded Images', at: 1 },
]

function B_T22({ step }: { step: number }) {
  const BW = 178
  const GAP = 18
  const X0 = (586 - (3 * BW + 2 * GAP)) / 2
  const BY = 128
  return (
    <Frame w={586} h={350}>
      {/* the question at the top */}
      <Show on={step >= 1} style={{ position: 'absolute', left: 133, top: 6, width: 320, height: 58 }}>
        <div style={{ ...card(litAt(step, 4), 14), position: 'absolute', inset: 0, ...flex(10, 'row', { justifyContent: 'center' }) }}>
          <IconTile name="Route" size={34} />
          <span style={heading(17)}>Application's Access Pattern</span>
        </div>
      </Show>
      {FAMS.map((f, i) => {
        const x = X0 + i * (BW + GAP)
        const cx = x + BW / 2
        const on = step >= f.at
        return (
          <div key={f.t}>
            <Arrow x1={293 + (i - 1) * 40} y1={68} x2={cx} y2={BY - 4} on={on} />
            <Show on={on} style={{ position: 'absolute', left: x, top: BY, width: BW, height: 214 }}>
              <div style={{ ...card(litAt(step, f.at)), position: 'absolute', inset: 0, ...flex(6, 'column', { justifyContent: 'flex-start', padding: '16px 12px', boxSizing: 'border-box' }) }}>
                <Tile src={f.logo} size={56} />
                <span style={{ ...heading(18), marginTop: 6 }}>{f.t}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: colors.muted }}>{f.svc}</span>
                <div style={{ marginTop: 'auto', width: '100%', minHeight: 50, padding: '6px 10px', boxSizing: 'border-box', borderRadius: 12, background: colors.surface2, display: 'grid', placeItems: 'center', textAlign: 'center', fontSize: 15, fontWeight: 600, lineHeight: 1.25, color: colors.brandDark }}>{f.ex}</div>
              </div>
            </Show>
          </div>
        )
      })}
    </Frame>
  )
}

export const figures: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  B_T11: B_T11 as (p: Record<string, unknown>) => ReactNode,
  B_T11B: B_T11B as (p: Record<string, unknown>) => ReactNode,
  B_T12: B_T12 as (p: Record<string, unknown>) => ReactNode,
  B_T13: B_T13 as (p: Record<string, unknown>) => ReactNode,
  B_T14: B_T14 as (p: Record<string, unknown>) => ReactNode,
  B_T16: B_T16 as (p: Record<string, unknown>) => ReactNode,
  B_T17: B_T17 as (p: Record<string, unknown>) => ReactNode,
  B_T18: B_T18 as (p: Record<string, unknown>) => ReactNode,
  B_T19: B_T19 as (p: Record<string, unknown>) => ReactNode,
  B_T20: B_T20 as (p: Record<string, unknown>) => ReactNode,
  B_T22: B_T22 as (p: Record<string, unknown>) => ReactNode,
}
export const slides = {}
export const css = ''
