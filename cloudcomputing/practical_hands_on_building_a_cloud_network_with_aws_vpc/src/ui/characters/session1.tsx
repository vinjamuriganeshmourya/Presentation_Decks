/**
 * Concept illustrations for Session 1 — Client–Server & CORS.
 * Flat-vector, brand-palette, same visual language as concepts.tsx.
 * Each depicts exactly the concept of the slide it sits on (plan Rev 7).
 */
import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Arrow } from './concepts'

/** House ease (tokens.easing.soft). */
const EASE = [0.22, 1, 0.36, 1] as const
/** Center-origin transform for SVG nodes animated with scale. */
const CENTER = { transformBox: 'fill-box', transformOrigin: 'center' } as const

const MONO = "'JetBrains Mono', ui-monospace, monospace"

/** White browser-window card (client), matching ConceptApi's client style. */
function BrowserCard({ x, y, w = 110, h = 92 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
      <rect x={x} y={y} width={w} height="20" rx="10" fill="#EAF1FF" />
      <circle cx={x + 14} cy={y + 10} r="3.5" fill="#FF8A3D" />
      <circle cx={x + 26} cy={y + 10} r="3.5" fill="#12B5A8" />
      <rect x={x + 16} y={y + 34} width={w - 38} height="8" rx="4" fill="#D8E3F5" />
      <rect x={x + 16} y={y + 50} width={w - 58} height="8" rx="4" fill="#E8F0FF" />
      <rect x={x + 16} y={y + 66} width={w - 48} height="8" rx="4" fill="#E8F0FF" />
    </g>
  )
}

/** Gradient server card, matching ConceptApi's server style. */
function ServerCard({ x, y, gradId, w = 96, h = 104 }: { x: number; y: number; gradId: string; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="16" fill={`url(#${gradId})`} />
      <rect x={x + 14} y={y + 16} width={w - 28} height="10" rx="5" fill="#FFFFFF" fillOpacity="0.85" />
      <rect x={x + 14} y={y + 36} width={w - 28} height="10" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
      <rect x={x + 14} y={y + 56} width={w - 28} height="10" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
      <circle cx={x + w / 2} cy={y + h - 20} r="8" fill="#FF8A3D" />
    </g>
  )
}

function PortTag({ x, y, text, color = '#0B5FFF' }: { x: number; y: number; text: string; color?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill={color}>
      {text}
    </text>
  )
}

/**
 * TWO APPS, NO WIRE — the Part-B opening state (§5): React on :3000 talks
 * to someone else's static API; Django runs on :8000, nothing calls it;
 * between them, a broken connector. (Rev 7: the :8000 tag is back — the new
 * TR puts Django on 8000 by §4, before this scene appears.)
 */
export function TwoAppsScene({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g = `s1-two-${uid}`
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33C6B7" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
      </defs>

      {/* external static API (someone else's server) */}
      <g>
        <rect x="60" y="14" width="128" height="34" rx="17" fill="#EAF1FF" stroke="#D8E3F5" strokeWidth="2" />
        <text x="124" y="36" textAnchor="middle" fontFamily={MONO} fontSize="12" fill="#0B5FFF">
          apis.ccbp.in
        </text>
      </g>

      {/* React app (client) — the only one with a port claim */}
      <BrowserCard x={30} y={92} />
      <PortTag x={85} y={210} text=":3000" />
      {/* live wire up to the static API */}
      <Arrow x1={95} y1={88} x2={105} y2={54} color="#0B5FFF" />
      <Arrow x1={125} y1={54} x2={115} y2={88} color="#12B5A8" dashed />

      {/* Django (runs on :8000, nothing calls it) */}
      <ServerCard x={330} y={86} gradId={g} />
      <PortTag x={378} y={212} text=":8000" color="#0E9285" />
      <text x={378} y={230} textAnchor="middle" fontFamily={MONO} fontSize="12" fill="#0E9285">
        runs · unused
      </text>

      {/* broken connector — the whole point (dashes keep trying, the ✗ holds) */}
      <line x1="152" y1="140" x2="204" y2="140" stroke="#FF8A3D" strokeWidth="4" strokeLinecap="round" />
      <motion.line
        x1="256"
        y1="140"
        x2="322"
        y2="140"
        stroke="#FF8A3D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 9"
        animate={{ strokeDashoffset: [0, -22] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
      <motion.g
        style={CENTER}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="230" cy="140" r="16" fill="#FFFFFF" stroke="#FF8A3D" strokeWidth="3" />
        <path d="M224 134 l12 12 M236 134 l-12 12" stroke="#FF8A3D" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}

/**
 * CORS GATE — the guard at the gate (§4–§6): Django's response has ARRIVED,
 * but the browser-side gate holds it until the allow-list carries the page's
 * origin. Board: :3000 allowed, :5500 not.
 */
export function CorsGate({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g = `s1-gate-${uid}`
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33C6B7" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
      </defs>

      {/* server (the response's origin) */}
      <ServerCard x={18} y={70} gradId={g} w={88} h={96} />
      <PortTag x={62} y={186} text=":8000" color="#0E9285" />

      {/* the response — arrived, waiting at the gate */}
      <g>
        <rect x="128" y="104" width="86" height="30" rx="15" fill="#2ECC71" />
        <text x="171" y="124" textAnchor="middle" fontFamily={MONO} fontSize="12" fontWeight="700" fill="#FFFFFF">
          200 OK
        </text>
        {/* motion trail */}
        <line x1="112" y1="119" x2="122" y2="119" stroke="#2ECC71" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      </g>

      {/* the gate: posts + closed barrier */}
      <g>
        <rect x="238" y="58" width="10" height="124" rx="5" fill="#1F2430" />
        <rect x="238" y="70" width="94" height="12" rx="6" fill="#FF8A3D" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={252 + i * 26} y={70} width="10" height="12" fill="#FFFFFF" fillOpacity="0.55" />
        ))}
        <rect x="238" y="128" width="94" height="12" rx="6" fill="#FF8A3D" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={252 + i * 26} y={128} width="10" height="12" fill="#FFFFFF" fillOpacity="0.55" />
        ))}
      </g>

      {/* allow-list board (the names left at the gate) */}
      <g>
        <rect x="236" y="6" width="118" height="52" rx="9" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
        <text x="252" y="27" fontFamily={MONO} fontSize="12" fill="#1F2430">:3000</text>
        <text x="320" y="27" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#2ECC71">✓</text>
        <text x="252" y="47" fontFamily={MONO} fontSize="12" fill="#1F2430">:5500</text>
        <text x="320" y="47" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#FF5F57">✗</text>
      </g>

      {/* the page, waiting behind the gate */}
      <BrowserCard x={348} y={78} w={96} h={84} />
      <PortTag x={396} y={186} text=":3000" />
    </svg>
  )
}

/**
 * ENV CONFIG — one saved contact (§7): a single .env value feeds every
 * request; change it once and every call re-points.
 */
export function EnvConfig({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const g = `s1-env-${uid}`
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C80FF" />
          <stop offset="100%" stopColor="#0B5FFF" />
        </linearGradient>
      </defs>

      {/* the one .env card */}
      <g>
        <rect x="16" y="76" width="150" height="88" rx="12" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
        <rect x="16" y="76" width="150" height="24" rx="10" fill="#EAF1FF" />
        <text x="30" y="93" fontFamily={MONO} fontSize="12" fontWeight="700" fill="#0B5FFF">.env</text>
        <text x="30" y="122" fontFamily={MONO} fontSize="10.5" fill="#1F2430">VITE_API_BASE_URL=</text>
        <rect x="30" y="132" width="108" height="10" rx="5" fill="#FFB055" />
        <rect x="30" y="148" width="70" height="8" rx="4" fill="#E8F0FF" />
      </g>

      {/* three request pills, all fed by the same value */}
      {[
        { y: 42, label: 'GET /api/products/' },
        { y: 106, label: 'POST /users/login/' },
        { y: 170, label: 'GET /cart/' },
      ].map((r) => (
        <g key={r.y}>
          <rect x="208" y={r.y} width="140" height="28" rx="14" fill="#EAF1FF" stroke="#D8E3F5" strokeWidth="1.5" />
          <text x="278" y={r.y + 18} textAnchor="middle" fontFamily={MONO} fontSize="10" fill="#0B5FFF">
            {r.label}
          </text>
        </g>
      ))}

      {/* one value fans out… */}
      <path d="M170 120 C 190 120 190 56 204 56" stroke="#FFB055" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="170" y1="120" x2="204" y2="120" stroke="#FFB055" strokeWidth="3" strokeLinecap="round" />
      <path d="M170 120 C 190 120 190 184 204 184" stroke="#FFB055" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* …and every request converges on the one server */}
      <Arrow x1={352} y1={56} x2={392} y2={104} color="#0B5FFF" />
      <Arrow x1={352} y1={120} x2={392} y2={120} color="#0B5FFF" />
      <Arrow x1={352} y1={184} x2={392} y2={136} color="#0B5FFF" />
      <ServerCard x={396} y={70} gradId={g} w={52} h={100} />
    </svg>
  )
}

/** Rounded tool card with an official logo and a spring-in ✓ badge. */
function ToolCard({
  x,
  y,
  label,
  logo,
  delay,
  children,
}: {
  x: number
  y: number
  label: string
  logo?: string
  delay: number
  children?: ReactNode
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: EASE }}
    >
      <rect x={x} y={y} width="120" height="118" rx="14" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
      <rect x={x} y={y} width="120" height="22" rx="11" fill="#EAF1FF" />
      <circle cx={x + 15} cy={y + 11} r="3.5" fill="#FF8A3D" />
      <circle cx={x + 27} cy={y + 11} r="3.5" fill="#12B5A8" />
      {/* the real mark (official logo asset, MIT-licensed Devicon set) */}
      {logo && <image href={logo} x={x + 38} y={y + 46} width="44" height="44" />}
      {children}
      <text x={x + 60} y={y + 148} textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#1F2430">
        {label}
      </text>
      <motion.g
        style={CENTER}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.4, type: 'spring', stiffness: 420, damping: 16 }}
      >
        <circle cx={x + 106} cy={y + 4} r="12" fill="#12B5A8" />
        <path
          d={`M${x + 100} ${y + 4} l4 5 l8 -9`}
          stroke="#FFFFFF"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </motion.g>
  )
}

/**
 * TOOLCHAIN — Local Setup divider (§1–§2): VS Code and Python (official
 * marks) are installed and checked off; the Node slot is empty and pulsing —
 * the single missing piece this section installs. Motion: cards stagger in,
 * badges spring, the ? breathes.
 */
export function Toolchain({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      {/* shelf the toolchain sits on */}
      <motion.line
        x1="30"
        y1="162"
        x2="430"
        y2="162"
        stroke="#D8E3F5"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />

      {/* VS Code — the editor */}
      <ToolCard x={30} y={42} label="VS Code" logo="/assets/tech/vscode.svg" delay={0.15} />

      {/* Python — runs the backend */}
      <ToolCard x={170} y={42} label="Python" logo="/assets/tech/python.svg" delay={0.4} />

      {/* Node — the empty, highlighted slot (the gap) */}
      <motion.g
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5, ease: EASE }}
      >
        <rect
          x="310"
          y="42"
          width="120"
          height="118"
          rx="14"
          fill="#FFF6EF"
          stroke="#FF8A3D"
          strokeWidth="2.5"
          strokeDasharray="7 6"
        />
        <motion.text
          x="370"
          y="118"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="44"
          fontWeight="700"
          fill="#FF8A3D"
          style={CENTER}
          animate={{ scale: [1, 1.14, 1], opacity: [1, 0.7, 1] }}
          transition={{ delay: 1.2, duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          ?
        </motion.text>
        <text x="370" y="190" textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#E5732A">
          Node
        </text>
      </motion.g>
    </svg>
  )
}

/** Rounded-top door with its port number, shared by PortsDoors. */
function Door({ x, y, h, gradId, port }: { x: number; y: number; h: number; gradId: string; port: string }) {
  const w = 52
  const r = w / 2
  return (
    <g>
      <path d={`M${x} ${y + h} v${-(h - r)} a${r} ${r} 0 0 1 ${w} 0 v${h - r} z`} fill={`url(#${gradId})`} />
      <circle cx={x + w - 12} cy={y + h - 34} r="3.5" fill="#FFFFFF" fillOpacity="0.9" />
      <text
        x={x + w / 2}
        y={y + h - 12}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="13"
        fontWeight="700"
        fill="#FFFFFF"
      >
        {port}
      </text>
    </g>
  )
}

/**
 * PORTS / DOORS — Ports divider (§4): one building (this laptop, `localhost`),
 * many numbered doors; the backend stands at door 8000, the frontend at door
 * 3000 — one program per door.
 */
export function PortsDoors({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const gTeal = `s1-door-t-${uid}`
  const gBlue = `s1-door-b-${uid}`
  const gSrv = `s1-door-s-${uid}`
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={gTeal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33C6B7" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
        <linearGradient id={gBlue} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C80FF" />
          <stop offset="100%" stopColor="#0B5FFF" />
        </linearGradient>
        <linearGradient id={gSrv} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#33C6B7" />
          <stop offset="100%" stopColor="#0E9285" />
        </linearGradient>
      </defs>

      {/* the building = this one machine */}
      <rect x="118" y="26" width="224" height="170" rx="16" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
      <rect x="118" y="26" width="224" height="26" rx="13" fill="#EAF1FF" />
      <text x="230" y="44" textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#0B5FFF">
        localhost
      </text>

      {/* the two claimed doors */}
      <Door x={146} y={112} h={84} gradId={gTeal} port="8000" />
      <Door x={262} y={112} h={84} gradId={gBlue} port="3000" />

      {/* …one machine has thousands of doors */}
      <path d="M222 196 v-20 a8 8 0 0 1 16 0 v20 z" fill="#E8F0FF" />
      <text x="230" y="166" textAnchor="middle" fontFamily={MONO} fontSize="11" fill="#8A99A8">
        …
      </text>

      {/* the backend, walking up to its door */}
      <motion.g
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
      >
        <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
          <ServerCard x={28} y={104} gradId={gSrv} w={60} h={72} />
        </motion.g>
      </motion.g>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.4 }}>
        <Arrow x1={94} y1={150} x2={140} y2={150} color="#0E9285" />
      </motion.g>

      {/* the frontend, walking up to its door */}
      <motion.g
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
      >
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        >
          <BrowserCard x={372} y={106} w={64} h={62} />
        </motion.g>
      </motion.g>
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.4 }}>
        <Arrow x1={366} y1={150} x2={320} y2={150} color="#0B5FFF" />
      </motion.g>

      {/* ground */}
      <motion.line
        x1="24"
        y1="196"
        x2="436"
        y2="196"
        stroke="#D8E3F5"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
    </svg>
  )
}

/**
 * ORIGIN / FLATS — Origin divider (§7 phrase 1): one building (`localhost`),
 * two flats — :3000 and :8000. Mail addressed to flat 3000 is not for flat
 * 8000: "same machine" means nothing to the browser.
 */
export function OriginFlats({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 240" className={className} aria-hidden>
      {/* the building = one host */}
      <rect x="196" y="20" width="180" height="176" rx="14" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
      <rect x="196" y="20" width="180" height="26" rx="13" fill="#EAF1FF" />
      <text x="286" y="38" textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill="#0B5FFF">
        localhost
      </text>

      {/* flat :3000 */}
      <rect x="216" y="60" width="140" height="56" rx="10" fill="#E8F0FF" stroke="#0B5FFF" strokeWidth="2" />
      <text x="286" y="94" textAnchor="middle" fontFamily={MONO} fontSize="14" fontWeight="700" fill="#0B5FFF">
        :3000
      </text>

      {/* flat :8000 */}
      <rect x="216" y="128" width="140" height="56" rx="10" fill="#E9F8F6" stroke="#0E9285" strokeWidth="2" />
      <text x="286" y="162" textAnchor="middle" fontFamily={MONO} fontSize="14" fontWeight="700" fill="#0E9285">
        :8000
      </text>

      {/* the mail — addressed to one flat only */}
      <motion.g
        initial={{ opacity: 0, x: -28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: EASE }}
      >
        <rect x="36" y="104" width="88" height="58" rx="8" fill="#FFFFFF" stroke="#D8E3F5" strokeWidth="2" />
        <path d="M38 108 L80 138 L122 108" stroke="#D8E3F5" strokeWidth="2" fill="none" />
        <rect x="94" y="112" width="20" height="14" rx="3" fill="#FF8A3D" />
        <text x="80" y="182" textAnchor="middle" fontFamily={MONO} fontSize="12" fontWeight="700" fill="#0B5FFF">
          to :3000
        </text>
      </motion.g>

      {/* delivered to :3000… */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.45, ease: EASE }}>
        <Arrow x1={128} y1={118} x2={210} y2={90} color="#0B5FFF" />
      </motion.g>
      {/* …never to :8000 */}
      <motion.line
        x1="128"
        y1="148"
        x2="204"
        y2="156"
        stroke="#8A99A8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.25, duration: 0.4 }}
      />
      <motion.g
        style={CENTER}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 380, damping: 15 }}
      >
        <circle cx="168" cy="152" r="11" fill="#FFFFFF" stroke="#FF5F57" strokeWidth="2.5" />
        <path d="M163.5 147.5 l9 9 M172.5 147.5 l-9 9" stroke="#FF5F57" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* ground */}
      <motion.line
        x1="28"
        y1="196"
        x2="432"
        y2="196"
        stroke="#D8E3F5"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      />
    </svg>
  )
}
