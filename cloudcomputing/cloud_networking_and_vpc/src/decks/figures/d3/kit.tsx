import type { CSSProperties } from 'react'

/**
 * THE 3D KIT of this deck (2026-10-26, the user: rebuild the visuals in session
 * 1's 3D illustration style; the flat isometric look is retired).
 *
 * Two sources, in this order:
 *
 *   1. The asset library, `assets/icons/Icons` at the repo root: glossy 3D
 *      renders (cloud, server stack, database, laptop, shield, clock, gear,
 *      people...). The ones this deck uses are copied, trimmed and resized to
 *      360px into `public/assets/icons3d/` and drawn with `Icon3D`. The single-
 *      file build inlines only the ones a slide references.
 *   2. Session 1's drawn objects (`clay-b`, `clay-c`, `clay-d`, `art`), the same
 *      look in svg: front-facing solids with a lit top, gradients, a specular
 *      on the upper left, glows on lights and a blurred cool ground shadow.
 *      They need `ART_CSS` and `mountClayDefs()`, mounted by `deployDeck.tsx`.
 *
 * The rules every figure follows: objects face the viewer (no isometric
 * projection, no flat three-tone boxes); every object stands on a soft shadow;
 * labels are HTML (`Label`), never svg text; connectors are `scene.tsx`'s
 * `Arrow` and `Traveller`; colours are the template's; nothing touches the
 * stage edge (24px clear on every side) and nothing overlaps.
 */

export type IconName =
  | 'ai-brain' | 'boy-laptop' | 'climb' | 'clock' | 'cloud' | 'cloud-storage' | 'coder' | 'dashboard' | 'database'
  | 'data-storage' | 'data-tree' | 'desktop' | 'documents' | 'folder-cloud' | 'folder' | 'gauge' | 'gear' | 'girl-laptop'
  | 'globe-network' | 'hierarchy' | 'hourglass' | 'https' | 'integration' | 'laptop' | 'layers' | 'man-idea' | 'man-pro'
  | 'meter' | 'network' | 'robot-code' | 'robot' | 'rocket' | 'router' | 'satellite' | 'server-network' | 'server-stack'
  | 'shield-lock' | 'shield-open' | 'steps' | 'student-bag' | 'student-thumbs' | 'target-coin' | 'target' | 'teamwork'
  | 'thinking' | 'tools' | 'update' | 'warning' | 'woman-pro'

/** A name in the list above, or one a section copied in later from the library (same trim and size). */
export type IconRef = IconName | (string & {})

/*
 * The renders a slide uses are IMPORTED from `./icons/` (2026-10-26: a path built at runtime,
 * `/assets/icons3d/${name}.png`, was invisible to the single-file build's inliner, so the deliverable
 * shipped seven broken images). Vite turns each import into a data URI in the single-file build. A name
 * not in `./icons/` falls back to `public/assets/icons3d/`, which works in dev only: copy it into
 * `./icons/` before it ships.
 */
const BUNDLED = import.meta.glob('./icons/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const iconSrc = (name: IconRef) => BUNDLED[`./icons/${name}.png`] ?? `/assets/icons3d/${name}.png`

/** The cool ground shadow every object stands on (session 1's `Shadow`, as CSS). */
export function GroundShadow({ w, style }: { w: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto"
      style={{ width: w * 0.78, height: Math.max(6, w * 0.07), marginTop: -Math.max(3, w * 0.035), borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(31,64,140,0.26), rgba(31,64,140,0))', ...style }}
    />
  )
}

/**
 * One library render, `w` px wide (height follows the image), on its ground
 * shadow. `dim` is the inactive state (opacity, as session 1's frosted things).
 */
export function Icon3D({ name, w, h, shadow = true, dim = false, className = '', style, alt = '' }: { name: IconRef; w: number; h?: number; shadow?: boolean; dim?: boolean; className?: string; style?: CSSProperties; alt?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`} style={{ width: w, opacity: dim ? 0.4 : 1, transition: 'opacity 420ms cubic-bezier(0.22,1,0.36,1)', ...style }}>
      <img src={iconSrc(name)} alt={alt} draggable={false} className="block select-none" style={{ width: w, height: h ?? 'auto', objectFit: 'contain' }} />
      {shadow && <GroundShadow w={w} />}
    </div>
  )
}

/* session 1's drawn objects, re-exported so a section file imports one place */
export { ClayMainframe, ClayDesktop, ClayServerBox, ClayCloud, ClayCloudScene, ClayDataCentre, ClayInstitution, ClayClock, ClayJobTray, ClayTable, ClayBook, ClayOsWindow, ClayBar, ClayFlats, ClayShop, ClayParcel, ClayTruck, ClayScale, LAB } from '../clay-b'
export { RichCloud, ClayLaptop, ClayPhone, ClayMonitor, ClayTerminal, ClayServer, ClayRack, ClayLockIcon, TenantTile, ClayClipboard, ClayCalculator, ClayItDesk, ClayTicket, ClayCalendar, ClayAtm, ClayPlate, ClayStove, ClayHouse, ElectricMeter, ClayFan, ClayBulb, ClayFridge, ClayBill } from '../clay-c'
export { ClayCoins, ClayCoin, ClayMeter, ClayBell, ClayBalance, ClayPin, ClayRocket, ClayPadlock, ClayTools, ClayFittedCupboards, ClayMovingBox, ClayTaxi, ClayParkedCar, ClayBars, ClayMoon, ClayServerUnit, ClayComputer, ClayNo } from '../clay-d'
