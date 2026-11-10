import { colors } from '@/design/tokens'
import { ArrowHead } from './figures/ArrowHead'

/**
 * TunnelPath — how a request from the public internet reaches a laptop that has
 * no public address.
 *
 * WHAT IT ARGUES, AND WHY IT IS DRAWN IN TWO PHASES
 *   A straight left-to-right path (GitHub, then a tunnel service, then the
 *   laptop) is easy to read and teaches the wrong thing: it leaves a learner
 *   believing the service handed their laptop a public address. It did not.
 *   The laptop opened an OUTBOUND connection and held it open, and the request
 *   travels back down that same pipe. Phase 1 is the dial-out, phase 2 is the
 *   delivery, and the order is the explanation.
 *
 *   This figure is the answer to `MachineBoundary`, which draws a request from
 *   outside dying at the localhost boundary. Show them in that order or the
 *   tunnel is a diagram rather than a resolution.
 *
 * CHOSEN IN `slide-kit/socket-lab` (devPort 5235), 2026-09-10, over the
 * straight-path version, which was rejected for exactly the reason above.
 *
 * SCOPE NOTE
 *   The tunnel service is drawn as a plain labelled box and named by prop. The
 *   figure is about the shape of the traversal, not about one vendor.
 *
 * ONE THING TO KNOW BEFORE EDITING
 *   Every label carries an explicit x. Round 1 centred them on their arrows and
 *   two printed through the laptop boundary. Hard rule 17: move a box, look at
 *   the picture. No harness catches this.
 */

const W = 1100
const H = 400

function Box({
  x, y, w, title, sub, tone, solid = false,
}: { x: number; y: number; w: number; title: string; sub: string; tone: string; solid?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={74} rx={12} fill={solid ? tone : colors.white} stroke={tone} strokeWidth={2} />
      <text x={x + w / 2} y={y + 30} textAnchor="middle" fill={solid ? colors.white : colors.ink} fontSize={19} fontWeight={700}>{title}</text>
      <text x={x + w / 2} y={y + 52} textAnchor="middle" fill={solid ? colors.white : colors.body} fontSize={15}>{sub}</text>
    </g>
  )
}

export function TunnelPath({
  sender = 'GitHub',
  senderSub = 'sends the webhook',
  service = 'ngrok',
  serviceSub = 'your dev domain',
  target = 'Jenkins',
  targetSub = 'localhost:8080',
  phaseOne = '1. you run ngrok http 8080',
  phaseTwo = '2. the webhook fires',
  footnote = 'No public address on your laptop. The pipe was opened from the inside.',
}: {
  sender?: string
  senderSub?: string
  service?: string
  serviceSub?: string
  target?: string
  targetSub?: string
  phaseOne?: string
  phaseTwo?: string
  footnote?: string
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="A laptop opens an outbound tunnel to a forwarding service, and an inbound webhook travels back down it">

      <Box x={40} y={190} w={200} title={sender} sub={senderSub} tone={colors.ink} />
      <Box x={430} y={190} w={240} title={service} sub={serviceSub} tone={colors.brand} solid />

      <rect x={830} y={120} width={230} height={210} rx={14} fill="none" stroke={colors.ink} strokeWidth={2} strokeDasharray="8 8" />
      <text x={844} y={110} fill={colors.ink} fontSize={17} fontWeight={600}>Your laptop</text>
      <Box x={860} y={195} w={170} title={target} sub={targetSub} tone={colors.brandDark} />

      {/* Phase 1 — outbound. Drawn right to left because that is the direction it travels. */}
      <text x={550} y={52} textAnchor="middle" fill={colors.accent} fontSize={17} fontWeight={700}>{phaseOne}</text>
      <line x1={860} y1={95} x2={670} y2={95} stroke={colors.accent} strokeWidth={2.5} strokeDasharray="7 7" />
      <ArrowHead d="M 860 95 L 670 95" color={colors.accent} strokeWidth={2.5} size={7} refX={9} />
      <text x={650} y={79} textAnchor="middle" fill={colors.accent} fontSize={16} fontWeight={600}>the laptop opens the tunnel, outbound</text>

      {/* Phase 2 — inbound, riding the pipe phase 1 opened. */}
      <text x={340} y={300} textAnchor="middle" fill={colors.brand} fontSize={17} fontWeight={700}>{phaseTwo}</text>
      <line x1={240} y1={227} x2={430} y2={227} stroke={colors.brand} strokeWidth={2.5} />
      <ArrowHead d="M 240 227 L 430 227" color={colors.brand} strokeWidth={2.5} size={7} refX={9} />
      <text x={335} y={215} textAnchor="middle" fill={colors.brand} fontSize={16} fontWeight={600}>POST</text>
      <line x1={670} y1={227} x2={860} y2={227} stroke={colors.brand} strokeWidth={2.5} />
      <ArrowHead d="M 670 227 L 860 227" color={colors.brand} strokeWidth={2.5} size={7} refX={9} />
      <text x={740} y={211} textAnchor="middle" fill={colors.brand} fontSize={16} fontWeight={600}>down the tunnel</text>

      <text x={40} y={378} fill={colors.body} fontSize={17}>{footnote}</text>
    </svg>
  )
}
