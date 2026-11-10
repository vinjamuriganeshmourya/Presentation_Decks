import type { CSSProperties } from 'react'
import { fonts } from '@/design/tokens'
import storyGirl from './art/story-girl.svg?raw'
import piggyBank from './art/piggy-bank.svg?raw'
import playlistPhone from './art/playlist-phone.svg?raw'
import attendanceRegister from './art/attendance-register.svg?raw'
import storiesPhone from './art/stories-phone.svg?raw'
import billingScanner from './art/billing-scanner.svg?raw'
import loopShape from './art/loop-shape.svg?raw'

/**
 * STORY ART — drawings that change with the lesson, not just decorate it.
 *
 * Drawn for PF 14 "For Loop" and kept as that deck drew them: a phone playing a
 * playlist, the three "same shape" examples, the loop shape itself, a girl and
 * her piggy bank. The central copies are in `slide-kit/assets/illustrations/story/`
 * (content rule 13); these are the same files.
 *
 * They are inline SVG, not <img>, for one reason: parts of each drawing change
 * between beats (the playing row moves, the pig frowns, the girl worries), and
 * an <img> cannot be told which beat it is on. The drawing's own classes are the
 * hooks, and the component that places it sets a state class on the wrapper:
 *
 *   playlist-phone      `.hk-hl` row highlight, `.hk-new` sixth song, `.hk-np`
 *                       now playing, `.hk-stop` stopped, `.hk-eq` equaliser
 *   story-girl          `.rs-smile` / `.rs-worry`
 *   piggy-bank          `.pg-smile` / `.pg-sad`
 *   the three examples  `.hkm-go`, the part that moves
 *   loop-shape          `.hk-never`, "Nowhere does it say six."
 *
 * Their text uses `var(--sans)` / `var(--mono)`, which the wrapper defines from
 * the kit's font tokens. Labels inside these are few and fixed; a figure that is
 * MOSTLY labels is still built from DOM (content rule 17).
 */
export const STORY_ART = {
  'story-girl': storyGirl,
  'piggy-bank': piggyBank,
  'playlist-phone': playlistPhone,
  'attendance-register': attendanceRegister,
  'stories-phone': storiesPhone,
  'billing-scanner': billingScanner,
  'loop-shape': loopShape,
} as const

export type StoryArtName = keyof typeof STORY_ART

/**
 * The drawings' beat states. `beat` on <StoryArt> sets `data-beat` on the
 * wrapper; these rules read it. They are the source deck's own timings, at the
 * explanatory tier already. A `<style>` here rather than in `index.css` because
 * the selectors are the drawings' internal classes: they belong with the art.
 */
const ART_CSS = `
.story-art .hk-hl{opacity:0;transition:transform 900ms cubic-bezier(.65,0,.35,1),opacity 260ms}
.story-art[data-beat="2"] .hk-hl{opacity:1;transform:translateY(0)}
.story-art[data-beat="3"] .hk-hl{opacity:1;transform:translateY(140px)}
.story-art[data-beat="4"] .hk-hl{opacity:1;transform:translateY(280px)}
.story-art[data-beat="5"] .hk-hl,.story-art[data-beat="6"] .hk-hl{opacity:1;transform:translateY(350px)}
.story-art .hk-rip{opacity:0;transform-box:fill-box;transform-origin:50% 50%}
.story-art[data-beat="2"] .hk-rip{animation:storyrip 620ms cubic-bezier(.22,1,.36,1) 1}
@keyframes storyrip{0%{opacity:.5;transform:scale(.34)}100%{opacity:0;transform:scale(1)}}
.story-art .hk-new{opacity:0;transform:translateY(14px);transition:opacity 320ms,transform 320ms}
.story-art[data-beat="5"] .hk-new,.story-art[data-beat="6"] .hk-new{opacity:1;transform:none}
.story-art .hk-np,.story-art .hk-stop{opacity:0;transition:opacity 260ms}
.story-art[data-beat="2"] .hk-np,.story-art[data-beat="3"] .hk-np,
.story-art[data-beat="5"] .hk-np,.story-art[data-beat="6"] .hk-np{opacity:1}
.story-art[data-beat="4"] .hk-stop{opacity:1}
.story-art .hk-eq{transition:opacity 260ms}
.story-art[data-beat="4"] .hk-eq{opacity:0}
.story-art .hk-eq rect{transform-box:fill-box;transform-origin:50% 100%;animation:storyeq 900ms ease-in-out infinite;animation-play-state:paused}
.story-art .hk-eq rect:nth-child(2){animation-delay:-300ms}
.story-art .hk-eq rect:nth-child(3){animation-delay:-600ms}
.story-art[data-beat="2"] .hk-eq rect,.story-art[data-beat="3"] .hk-eq rect,
.story-art[data-beat="5"] .hk-eq rect,.story-art[data-beat="6"] .hk-eq rect{animation-play-state:running}
@keyframes storyeq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}

.story-art .hkm-go{animation-play-state:paused}
.story-art[data-live="true"] .hkm-go{animation-play-state:running}
.story-art[data-name="attendance-register"] .hkm-go{animation:storyroll 2600ms steps(1,end) infinite}
.story-art[data-name="stories-phone"] .hkm-go{animation:storystory 3000ms steps(1,end) infinite}
.story-art[data-name="billing-scanner"] .hkm-go{animation:storyscan 3400ms steps(1,end) infinite}
.story-art[data-live="false"] .hkm-go{animation-play-state:paused}
@keyframes storyroll{0%{transform:translateY(0)}20%{transform:translateY(34px)}40%{transform:translateY(68px)}60%{transform:translateY(102px)}80%{transform:translateY(136px)}100%{transform:translateY(0)}}
@keyframes storystory{0%{transform:translateX(0)}20%{transform:translateX(20px)}40%{transform:translateX(40px)}60%{transform:translateX(60px)}80%{transform:translateX(80px)}100%{transform:translateX(0)}}
@keyframes storyscan{0%{transform:translateX(104px)}20%{transform:translateX(48px)}40%{transform:translateX(-8px)}60%{transform:translateX(-64px)}80%{transform:translateX(-120px)}100%{transform:translateX(104px)}}

.story-art .hk-never{opacity:0;transition:opacity 340ms}
.story-art[data-beat="4"] .hk-never{opacity:1}

.story-art .rs-smile,.story-art .pg-smile{opacity:1;transition:opacity 200ms}
.story-art .rs-worry,.story-art .pg-sad{opacity:0;transition:opacity 200ms}
.story-art[data-mood="sad"] .pg-smile,.story-art[data-mood="sad"] .rs-smile{opacity:0}
.story-art[data-mood="sad"] .pg-sad,.story-art[data-mood="sad"] .rs-worry{opacity:1}

@media (prefers-reduced-motion:reduce){.story-art *{animation-duration:1ms!important;transition-duration:1ms!important}}
`

export function StoryArt({
  name,
  beat,
  mood,
  live,
  className = '',
  style,
}: {
  name: StoryArtName
  /** The panel's beat, for a drawing whose parts change per beat. */
  beat?: number
  /** `sad` swaps the smile for the frown on the girl and the pig. */
  mood?: 'happy' | 'sad'
  /** For the three examples: whether the moving part is moving. */
  live?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <>
      <style>{ART_CSS}</style>
      <div
        className={`story-art [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
        data-name={name}
        data-beat={beat}
        data-mood={mood}
        data-live={live === undefined ? undefined : String(live)}
        style={{ ['--sans' as string]: fonts.body, ['--mono' as string]: fonts.mono, ...style }}
        dangerouslySetInnerHTML={{ __html: STORY_ART[name] }}
      />
    </>
  )
}
