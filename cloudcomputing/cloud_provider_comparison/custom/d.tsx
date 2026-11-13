import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { TILE_SKIN } from '@/decks/figures/card'
import { MOTION, motionHeld } from '@/motion/tokens'
import { litRing } from '@/decks/figures/net/frames'
import { Icon } from '@/engine/icon'
import awsMark from '../images/aws.png'
import azureMark from '../images/azure.svg'
import gcpMark from '../images/google-cloud.svg'
import gcpShell from '../images/gcp-cloud-shell.svg'

/*
 * BUILDER D · Cloud Provider Comparison (Session 11), section 4: slides 29 (C_T17) and 30 (C_T18).
 *
 * C_T17  three console windows (AWS EC2 console, Azure Portal, GCP Console) side by side, each a clean sketch with its
 *        official mark on a white tile and its own "create a VM" action; point 4 docks a Cloud Shell panel inside the
 *        GCP window (where GCP really opens it). After the build an orange ring walks shell → AWS → Azure → GCP, forever.
 * C_T18  the EC2 Launch Instance wizard drawn as a console page, its six sections as panels holding the TR text; the
 *        sections arrive one per press, then an orange ring walks 6 → 1 → 6, forever. No number badges (R10).
 *
 * Both stand on their own (no stage card behind the windows: `.dx-bare`). Loops are CSS (transform / opacity), held
 * still on ?still / thumbnails / reduced motion, where the full frame shows with nothing lit. Labels are DOM text.
 */

const EASE = MOTION.ease
const FONT = "'DM Sans', system-ui, sans-serif"
const useHeld = () => motionHeld(useInstant())

/** first → last → first forever once the build is done; starts on `start`; -1 on held frames */
function useCycle(n: number, done: boolean, start = 0, periodMs = 1400): number {
  const held = useHeld()
  const [i, setI] = useState(start)
  useEffect(() => {
    setI(start)
    if (!done || held || n < 1) return
    const id = window.setInterval(() => setI((v) => (v + 1) % n), periodMs)
    return () => window.clearInterval(id)
  }, [n, done, held, periodMs, start])
  return done && !held ? i : -1
}

const lv = (d = 0, t?: number): CSSProperties => ({ ['--dx-d' as string]: `${-d}s`, ...(t ? { ['--dx-t' as string]: `${t}s` } : {}) }) as CSSProperties

function Show({ on, children, style, delay = 0 }: { on: boolean; children: ReactNode; style?: CSSProperties; delay?: number }) {
  const instant = useInstant()
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(8px)',
        transition: instant ? 'none' : `opacity ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms, transform ${MOTION.reveal}ms ${EASE} ${on ? delay : 0}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** an official mark on its white tile (rule 54); the mark never moves */
function MarkTile({ src, size = 26, k = 0.72 }: { src: string; size?: number; k?: number }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.26), background: '#FFFFFF', boxShadow: '0 0 0 1px rgba(207,220,245,0.9), 0 3px 8px -4px rgba(16,32,58,0.45)', flexShrink: 0 }}>
      <img src={src} alt="" aria-hidden draggable={false} style={{ width: Math.round(size * k), height: 'auto', display: 'block' }} />
    </span>
  )
}

/** a lucide glyph on a soft tile; the glyph carries the loop */
function GlyphTile({ icon, size = 40, loop, d = 0, t, tone = colors.brand, bg }: { icon: string; size?: number; loop?: string; d?: number; t?: number; tone?: string; bg?: string }) {
  return (
    <span style={{ display: 'grid', placeItems: 'center', width: size, height: size, borderRadius: Math.round(size * 0.27), ...TILE_SKIN, ...(bg ? { background: bg, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)' } : {}), color: tone, flexShrink: 0 }}>
      <span className={loop ? `dx dx-${loop}` : undefined} style={{ display: 'grid', placeItems: 'center', ...lv(d, t) }}>
        <Icon name={icon} size={Math.round(size * 0.5)} />
      </span>
    </span>
  )
}

/** a grey skeleton bar standing for UI text the slide does not need */
const Bar = ({ w, h = 8, c = '#DCE4F2', r = 4, style }: { w: number | string; h?: number; c?: string; r?: number; style?: CSSProperties }) => <span style={{ display: 'block', width: w, height: h, borderRadius: r, background: c, flexShrink: 0, ...style }} />

/** a status LED that blinks on its own phase */
const Led = ({ c = colors.success, d = 0, s = 7 }: { c?: string; d?: number; s?: number }) => <span className="dx dx-blink" style={{ display: 'block', width: s, height: s, borderRadius: 99, background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0, ...lv(d) }} />

/** the browser's own frame: three dots and the tab title */
function BrowserBar({ title, h, size = 12 }: { title: string; h: number; size?: number }) {
  return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', background: '#EEF2F8', borderBottom: '1px solid #DCE3EF', flexShrink: 0 }}>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {['#F26B5B', '#F5BE4F', '#5BC46A'].map((c) => (
          <span key={c} style={{ width: 7, height: 7, borderRadius: 9, background: c, display: 'block' }} />
        ))}
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, color: '#3B4A63', whiteSpace: 'nowrap', background: '#FFFFFF', borderRadius: '7px 7px 0 0', padding: '3px 10px 2px', alignSelf: 'flex-end', boxShadow: 'inset 0 1px 0 #DCE3EF' }}>{title}</span>
    </div>
  )
}

/* ================================================================== C_T17 · three consoles, one task */

type Win = { tab: string; bar: string; mark: string; markK?: number; dark: boolean; page: string; action: string; icon: string }
const WINS: Win[] = [
  { tab: 'AWS Console', bar: '#232F3E', mark: awsMark, markK: 0.86, dark: true, page: 'EC2 Dashboard', action: 'Launch Instance', icon: 'Server' },
  { tab: 'Azure Portal', bar: '#0F6CBD', mark: azureMark, dark: true, page: 'Virtual Machine', action: 'Create', icon: 'MonitorCog' },
  { tab: 'GCP Console', bar: '#FFFFFF', mark: gcpMark, dark: false, page: 'VM Instances', action: 'Create Instance', icon: 'Cpu' },
]

const T17 = { W: 686, H: 330, m: 12, gap: 16, ww: 210, wh: 306, tabH: 26, barH: 34 }

function ConsoleWindow({ w, lit, hot, shell, shellLit, i }: { w: Win; lit: boolean; hot: boolean; shell: boolean; shellLit: boolean; i: number }) {
  const instant = useInstant()
  const ease = instant ? 'none' : `box-shadow 420ms ${EASE}`
  const base = '0 0 0 1px #CFDCF5, 0 14px 28px -18px rgba(31,64,140,0.45), 0 2px 6px rgba(31,64,140,0.06)'
  return (
    <div style={{ position: 'relative', width: T17.ww, height: T17.wh, borderRadius: 12, background: '#FFFFFF', boxShadow: litRing(lit, base), transition: ease, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <BrowserBar title={w.tab} h={T17.tabH} />
      {/* the console's own top bar, its mark on a white tile */}
      <div style={{ height: T17.barH, background: w.bar, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', borderBottom: w.dark ? 'none' : '1px solid #E3E8F1', flexShrink: 0 }}>
        <MarkTile src={w.mark} size={24} k={w.markK ?? 0.7} />
        <Bar w={86} h={12} r={6} c={w.dark ? 'rgba(255,255,255,0.22)' : '#EDF1F7'} />
        <Bar w={16} h={16} r={8} c={w.dark ? 'rgba(255,255,255,0.22)' : '#EDF1F7'} style={{ marginLeft: 'auto' }} />
      </div>
      {/* the page: its name, the create action, the instance list */}
      <div style={{ padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GlyphTile icon={w.icon} size={28} loop="float" d={i * 0.7} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: colors.ink, whiteSpace: 'nowrap' }}>{w.page}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className={hot ? 'dx dx-press' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              height: 30,
              padding: '0 12px',
              borderRadius: 8,
              background: colors.brand,
              color: '#FFFFFF',
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
              boxShadow: hot ? `0 0 0 3px #FFFFFF, 0 0 0 6px ${colors.accent}` : `0 6px 12px -8px ${colors.brandDeep}`,
              transition: instant ? 'none' : `box-shadow 360ms ${EASE}`,
            }}
          >
            <Icon name="Plus" size={14} />
            {w.action}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(i === 2 ? [0, 1] : [0, 1, 2, 3]).map((r) => (
            <div key={r} style={{ height: 22, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', borderRadius: 6, background: r % 2 ? '#FFFFFF' : '#F4F7FC', boxShadow: 'inset 0 0 0 1px #E6ECF6' }}>
              <Led d={r * 0.55 + i * 0.3} s={6} c={r === 3 ? '#9AA8BF' : colors.success} />
              <Bar w={58 + ((r * 17 + i * 11) % 30)} h={6} />
              <Bar w={30} h={6} c="#E7ECF5" style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      </div>
      {/* GCP Cloud Shell: docks at the foot of the same console window, as GCP opens it */}
      {i === 2 && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            height: 86,
            borderRadius: 9,
            background: '#1E2633',
            boxShadow: litRing(shellLit, '0 8px 16px -10px rgba(16,32,58,0.6)'),
            opacity: shell ? 1 : 0,
            transform: shell ? 'none' : 'translateY(24px)',
            transition: instant ? 'none' : `opacity ${MOTION.reveal}ms ${EASE}, transform ${MOTION.reveal}ms ${EASE}, box-shadow 420ms ${EASE}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: '#2A3445' }}>
            <MarkTile src={gcpShell} size={20} k={0.74} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#E6ECF7', whiteSpace: 'nowrap' }}>Cloud Shell</span>
          </div>
          <div style={{ padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, fontSize: 13, lineHeight: '14px', color: '#7FD3FF' }}>$</span>
              <span className="dx dx-type" style={{ display: 'block', width: 92, height: 6, borderRadius: 3, background: '#4B5A73', transformOrigin: 'left center' }} />
              <span className="dx dx-blink" style={{ display: 'block', width: 7, height: 14, background: '#E6ECF7', ...lv(0, 1.1) }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, fontSize: 13, lineHeight: '14px', color: '#7FD3FF' }}>$</span>
              <Bar w={60} h={6} c="#3A475C" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function C_T17({ step = 0 }: { step?: number }) {
  const held = useHeld()
  /* after the build: shell → AWS → Azure → GCP → shell ... (index 0 = shell) */
  const cyc = useCycle(4, step >= 4, 0)
  const live = !held
  const winLit = (i: number) => live && cyc < 0 && step === i + 1
  const hot = (i: number) => live && cyc === i + 1
  const shellLit = live && (cyc < 0 ? step === 4 : cyc === 0)
  return (
    <div className="dx-bare" style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ position: 'relative', width: T17.W, height: T17.H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: T17.gap }}>
        {WINS.map((w, i) => (
          <ConsoleWindow key={w.tab} w={w} i={i} lit={winLit(i)} hot={hot(i)} shell={held || step >= 4} shellLit={shellLit} />
        ))}
      </div>
    </div>
  )
}

/* ================================================================== C_T18 · the EC2 Launch Instance wizard */

type Item = { title: string; text: string; icon: string }
const LOOPS = ['rock', 'turn', 'pulse', 'rock', 'pulse', 'bob']

/** figure labels capitalise every word (rule 56); a word in brackets keeps its own form */
const titleCase = (s: string) => s.replace(/(^|\s)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase())

const T18 = { W: 1100, H: 360, inset: 10, tabH: 28, barH: 34, headH: 42, pad: 14, gap: 12, rowGap: 12 }

function WizardPanel({ it, i, on, lit, primary }: { it: Item; i: number; on: boolean; lit: boolean; primary: boolean }) {
  const instant = useInstant()
  const base = primary ? `0 12px 24px -14px ${colors.brandDeep}` : '0 0 0 1px #D5E0F3, 0 10px 20px -16px rgba(31,64,140,0.4)'
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0 }}>
      {/* the section's place on the page, before it is filled in */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#F3F6FB', boxShadow: 'inset 0 0 0 1px #E6ECF6' }} />
      <Show on={on} style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background: primary ? `linear-gradient(135deg, ${colors.brand} 0%, ${colors.brandDark} 100%)` : '#FFFFFF',
            boxShadow: litRing(lit, base),
            transition: instant ? 'none' : `box-shadow 420ms ${EASE}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
          }}
        >
          <GlyphTile icon={it.icon} size={40} loop={LOOPS[i]} d={i * 0.45} tone={primary ? '#FFFFFF' : colors.brand} bg={primary ? 'rgba(255,255,255,0.16)' : undefined} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span data-dx-title style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, lineHeight: 1.2, whiteSpace: 'nowrap', color: primary ? '#FFFFFF' : colors.ink }}>{titleCase(it.title)}</span>
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 16, lineHeight: 1.3, color: primary ? 'rgba(255,255,255,0.92)' : colors.body }}>{it.text}</span>
          </div>
        </div>
      </Show>
    </div>
  )
}

function C_T18({ step = 0, items = [] }: { step?: number; items?: Item[] }) {
  const held = useHeld()
  const n = items.length
  /* after the build the ring walks the sections, starting on the last one (the one just pressed) */
  const cyc = useCycle(n, step >= n, n - 1)
  const lit = (i: number) => !held && (cyc >= 0 ? cyc === i : step === i + 1)
  const row = (k: number) => items.slice(k * 3, k * 3 + 3).map((it, j) => {
    const i = k * 3 + j
    return <WizardPanel key={i} it={it} i={i} on={held || step >= i + 1} lit={lit(i)} primary={i === n - 1} />
  })
  const ww = T18.W - 2 * T18.inset
  const wh = T18.H - 2 * T18.inset
  return (
    <div className="dx-bare" style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
      <div style={{ width: ww, height: wh, borderRadius: 14, background: '#FFFFFF', boxShadow: '0 0 0 1px #CFDCF5, 0 16px 30px -20px rgba(31,64,140,0.5), 0 2px 6px rgba(31,64,140,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <BrowserBar title="AWS Console" h={T18.tabH} size={13} />
        {/* the AWS console's own top bar: mark, search, region */}
        <div style={{ height: T18.barH, background: '#232F3E', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexShrink: 0 }}>
          <MarkTile src={awsMark} size={26} k={0.86} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.14)', padding: '0 10px', color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="Search" size={13} />
            <Bar w={120} h={6} c="rgba(255,255,255,0.28)" />
          </span>
          <Bar w={64} h={12} r={6} c="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
          <Bar w={22} h={22} r={11} c="rgba(255,255,255,0.2)" />
        </div>
        {/* the page header: the wizard's name */}
        <div style={{ height: T18.headH, display: 'flex', alignItems: 'center', gap: 10, padding: `0 ${T18.pad + 2}px`, borderBottom: '1px solid #E6ECF6', flexShrink: 0 }}>
          <GlyphTile icon="Server" size={28} loop="float" />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 19, color: colors.ink, whiteSpace: 'nowrap' }}>Launch Instance</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <Bar w={54} h={6} />
            <Icon name="ChevronRight" size={12} style={{ color: '#A9B6CC' }} />
            <Bar w={70} h={6} />
          </span>
        </div>
        {/* the six sections in reading order: 1-3 across the top, 4-6 across the bottom */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: T18.rowGap, padding: T18.pad, background: '#FAFCFF' }}>
          <div style={{ flex: 1, display: 'flex', gap: T18.gap }}>{row(0)}</div>
          <div style={{ flex: 1, display: 'flex', gap: T18.gap }}>{row(1)}</div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ exports */

type Fig = (p: Record<string, unknown>) => ReactNode
export const figures: Record<string, Fig> = {
  C_T17: C_T17 as unknown as Fig,
  C_T18: C_T18 as unknown as Fig,
}

/* builder d's loop vocabulary, namespaced `dx-` so no other builder's classes collide */
export const css = `
.dx { animation-delay: var(--dx-d, 0s); }
@keyframes dx-float { 0%, 100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2.5px) scale(1.06) } }
.dx-float { animation: dx-float var(--dx-t, 3.6s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes dx-blink { 0%, 55% { opacity: 1 } 65% { opacity: 0.2 } 80%, 100% { opacity: 1 } }
.dx-blink { animation: dx-blink var(--dx-t, 1.8s) ease-in-out infinite; }
@keyframes dx-rock { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
.dx-rock { animation: dx-rock var(--dx-t, 3s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes dx-turn { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.dx-turn { animation: dx-turn var(--dx-t, 6s) linear infinite; }
@keyframes dx-pulse { 0%, 100% { transform: scale(0.94) } 50% { transform: scale(1.08) } }
.dx-pulse { animation: dx-pulse var(--dx-t, 2.4s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes dx-bob { 0%, 100% { transform: translateY(2px) } 50% { transform: translateY(-3px) } }
.dx-bob { animation: dx-bob var(--dx-t, 2.2s) cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes dx-press { 0%, 100% { transform: scale(1) } 45% { transform: scale(0.96) } 60% { transform: scale(1.02) } }
.dx-press { animation: dx-press 1.4s cubic-bezier(0.45,0,0.55,1) infinite; }
@keyframes dx-type { 0% { transform: scaleX(0.05) } 70%, 100% { transform: scaleX(1) } }
.dx-type { animation: dx-type var(--dx-t, 2.8s) steps(12, end) infinite; }
.cc-still .dx, .deck-thumb .dx { animation: none !important; }
.cc-still .dx-type, .deck-thumb .dx-type { transform: none !important; }
@media (prefers-reduced-motion: reduce) { .dx { animation: none !important; } .dx-type { transform: none !important; } }
/* the windows stand on their own: no stage card behind them (Session 9 rule, no wrapper card) */
[data-group]:has(> .dx-bare), [data-group]:has(> div > .dx-bare) { background: none !important; box-shadow: none !important; border-color: transparent !important; }
`
