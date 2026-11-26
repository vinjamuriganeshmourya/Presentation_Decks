import { useId, type ReactNode } from 'react'

/**
 * DEPTH PIECES (user, 2026-10-16, from the reference render "Cloud Computing:
 * From Guesswork to Scale", applied to slide 5 first): the reference's
 * objects, drawn with its own detail, depth, colours and style. Every solid
 * has a front, a lit top and a shaded side, a graded fill that turns it, a
 * specular on its upper left, a soft blurred ground shadow, and a glow on
 * every light. The colours are the render's (an object's own colours, as
 * `art.tsx` allows); slide chrome stays on the tokens. Labels stay DOM
 * (content rule 17). Each solid is one top-level `<g>` under `ClaySvg`, so
 * the clay rim runs round the whole form; shadows are `data-flat` and carry
 * their blur inline. The pieces live one cluster per file: `rack.tsx` (the
 * on-premise side), `cloud.tsx` (the cloud side), `card.tsx` (the card the
 * clusters sit on); this file holds the palette and the shared helpers.
 */

/** The render's palette. */
export const R = {
  // the rack
  chassisTop: '#3F4A6F',
  chassisBot: '#2E3755',
  sideTop: '#A3AFD3',
  sideBot: '#7F8DB8',
  topFace: '#BAC5E2',
  drawerTop: '#283052',
  drawerBot: '#1B2240',
  drawerIdle: '#3B4360',
  barA: '#8FC0FF',
  barB: '#5E9BFF',
  barIdle: '#56608A',
  ledBlue: '#3D8BFF',
  ledOff: '#3A4260',
  // the plinth
  plinthTop: '#F3F6FC',
  plinthTop2: '#E2E8F6',
  plinthFront: '#CBD4EA',
  // the coins
  goldHi: '#FFDC6A',
  gold: '#F5B623',
  goldSide: '#E8A41A',
  goldSideDark: '#C4860E',
  goldShine: '#FFF3BF',
  // the cloud
  cloudTop: '#6DAAFF',
  cloudMid: '#2F7BFF',
  cloudBot: '#1C5EE6',
  cloudUnder: '#154FCC',
  // the tiles
  frostTop: '#E9F0FD',
  frostFront: '#D3E1FB',
  frostSide: '#BFD0F3',
  ledGreen: '#3DDC84',
  ledFrost: '#B3C7EE',
  cable: '#9EC6FF',
  // the meter
  tileHi: '#5C9CFF',
  tileLo: '#1F5FE8',
  tileUnder: '#1748B8',
  dialEdge: '#E1E7F4',
  arcGrey: '#D6DDEC',
  arcGreen: '#2ECC71',
  needle: '#2B3350',
  shadow: '#1A2C5C',
}

/** A unique id prefix for this instance's gradients (several tiles share a slide). */
export function usePrefix() {
  return `d${useId().replace(/[^a-zA-Z0-9]/g, '')}`
}

/** A soft blurred ground shadow: flat (no clay rim), its blur inline so the clay class rule cannot replace it. */
export function Shadow({ id, cx, cy, rx, ry, o = 0.22 }: { id: string; cx: number; cy: number; rx: number; ry: number; o?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={R.shadow} opacity={o} data-flat style={{ filter: `url(#${id}-blur)` }} />
}

export function BlurDef({ id, sd = 4 }: { id: string; sd?: number }) {
  return (
    <filter id={`${id}-blur`} x="-40%" y="-120%" width="180%" height="340%">
      <feGaussianBlur stdDeviation={sd} />
    </filter>
  )
}

/** A light's glow: a radial fade of its own colour. */
export function GlowDef({ id, tone }: { id: string; tone: string }) {
  return (
    <radialGradient id={id} cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor={tone} stopOpacity={0.6} />
      <stop offset="0.55" stopColor={tone} stopOpacity={0.18} />
      <stop offset="1" stopColor={tone} stopOpacity={0} />
    </radialGradient>
  )
}

export function Lin({ id, from, to, x2 = 0, y2 = 1, children }: { id: string; from: string; to: string; x2?: number; y2?: number; children?: ReactNode }) {
  return (
    <linearGradient id={id} x1={0} y1={0} x2={x2} y2={y2}>
      <stop offset="0" stopColor={from} />
      {children}
      <stop offset="1" stopColor={to} />
    </linearGradient>
  )
}

