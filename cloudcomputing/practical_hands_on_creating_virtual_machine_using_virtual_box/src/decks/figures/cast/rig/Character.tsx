/* The renderer: a Pose and a Skin in, one SVG person out.
 *
 * Nothing here animates. Every number that moves comes in through `pose`, and
 * every colour and shape that makes the person a particular person comes in
 * through `skin`. This file owns the paint resolver, the head group and its
 * transforms, and the order the parts stack in. The parts themselves live
 * beside it: Body (ground to neck), Face (the features and their physiology),
 * Arm (one arm, mirrored for the right), and the paint tables in lighting.
 *
 * Space: viewBox 0 0 400 600, ground y=580, hips (200,360), shoulders y=205,
 * neck base (200,196), head centre (200,120). The head group's local origin
 * is the head centre: skull rx 50 ry 56, ears at (+-50, 2). An arm's local
 * frame hangs +y down the arm with +x toward the body; the right arm is the
 * left one mirrored about x=200. */
import { useId, type JSX } from 'react'
import type { Pose } from '../rig/channels'
import type { Skin } from '../skins/types'
import { ClayDefs, LitDefs, SHADE_SIDE, clayPaints, flatPaints } from '../rig/lighting'
import { Body } from '../rig/Body'
import { Face, Ear, facePhysiology } from '../rig/Face'
import { Arm } from '../rig/Arm'

/* The head pivots at the neck base, as a real one does, and the skull centre
   sits HEAD_RISE above it; a tilt therefore swings the chin, not the crown. */
const NECK_BASE = { x: 200, y: 196 }
const HEAD_RISE = 76
const HEAD_CY = NECK_BASE.y - HEAD_RISE
const EAR_X = 50
/* The flat shade crescent is the skull in its shade colour, with the skull in
   its skin colour laid over it shifted toward the lamp by this much. */
const CRESCENT = { dx: 6, dy: 2 }

export function Character({ pose, skin, width = 400, className }: { pose: Pose; skin: Skin; width?: number; className?: string }): JSX.Element {
  /* Two actors share a page, so every id is unique to this instance. */
  const u = useId().replace(/:/g, '')
  const id = (n: string) => `ch-${n}-${u}`
  const p = skin.palette
  const flat = skin.shading !== 'lit'
  const clay = skin.shading === 'clay'
  /* Parts ask for paint by name. In the lit look every name is a def; in the
     flat look it is a colour from the table, so the same part draws either
     way, and a flat SVG carries no filter or gradient of the renderer's own.
     The clay look is the flat colours plus one volume filter per group.
     Names outside the table (the clips) resolve to a def in every look. */
  const def = (n: string) => `url(#${id(n)})`
  const paints = clay ? clayPaints(p, def) : flat ? flatPaints(p) : {}
  const url = (n: string) => paints[n] ?? def(n)
  /* The ear's inner curve is the one line Riya's reference draws on the
     head, in her outline colour; Arjun's is a shade, which Ear defaults to. */
  const earLine = skin.art === 'line' ? skin.outline : undefined
  /* The narrower female skull gets an ear 20 percent smaller, tucked a px
     inward so the lock that frames the face covers its front half and only
     the back half shows against the hair, as in reference/riya.png. At full
     size the ear stood proud of the hair on both sides and read as two
     skin blobs; the scale is keyed on headScale, the thing that narrows the
     skull the ear sits against. */
  const earScale = skin.headScale.x < 1 ? 0.8 : 1
  void (earScale < 1 ? EAR_X - 1 : EAR_X) // deck vendoring: the lab computes earX but no longer draws with it

  const phys = facePhysiology(pose)
  const { nod, turn, faceXf } = phys
  const headXf = `translate(${NECK_BASE.x} ${NECK_BASE.y}) rotate(${pose.headTilt}) scale(${skin.headScale.x} ${skin.headScale.y}) translate(0 ${-HEAD_RISE + pose.headY + nod * 5})`
  /* 2.5D: the skull slides a little and narrows a little with a turn; the
     features in Face slide further, so the face turns more than the head. */
  const skullXf = `translate(${turn * 4} 0) scale(${1 - Math.abs(turn) * 0.05} 1)`
  /* Hair behind the head slides a little against a turn. Hair that falls
     to the waist goes behind the torso instead of behind the skull alone,
     in the same head frame so it still turns and tilts with the head. */
  const hairBack = skin.hairBack && (
    <g transform={`translate(${turn * -3} 0)`} filter={clay ? url('clayHair') : undefined}>
      {skin.hairBack}
    </g>
  )
  const fallingHair = skin.hairFalls ? (
    <g data-part="hair-back" transform={headXf}>
      {hairBack}
    </g>
  ) : undefined

  return (
    <svg viewBox="0 0 400 600" width={width} height={width * 1.5} className={className} role="img" aria-label={skin.label}>
      <defs>
        {!flat && <LitDefs id={id} p={p} headCy={HEAD_CY} />}
        {clay && <ClayDefs id={id} />}
        <clipPath id={id('skull')}>
          <path d={skin.head} />
        </clipPath>
        <clipPath id={id('legL')}>
          <rect x="0" y="0" width="200" height="600" />
        </clipPath>
        <clipPath id={id('legR')}>
          <rect x="200" y="0" width="200" height="600" />
        </clipPath>
      </defs>

      <Body pose={pose} skin={skin} nod={nod} url={url} behind={fallingHair}>
        <g data-part="head" transform={headXf}>
          {!skin.hairFalls && hairBack}
          {/* Ears sit behind the skull so the one on the near side of a turn
              slides out of sight, as a real ear does. */}
          <g transform={`translate(${turn * 4} 0)`} filter={clay ? url('clayLimb') : undefined}>
            <Ear x={-EAR_X + (turn < 0 ? -turn * 14 : turn * 2)} flip={-1} fill={url('skin')} p={p} line={earLine} />
            <Ear x={EAR_X - (turn > 0 ? turn * 14 : -turn * 2)} flip={1} fill={url('skin')} p={p} line={earLine} />
          </g>
          {clay ? (
            /* Clay skull: one flat fill; the filter turns it. */
            <g data-part="skull" transform={skullXf} filter={url('clayHead')}>
              <path d={skin.head} fill={p.skin} />
            </g>
          ) : flat ? (
            /* Flat skull: skin colour with one shade crescent down the side
               away from the lamp. The clip keeps the shifted copy inside the
               silhouette, so the crescent is a shape, not an outline. */
            <g data-part="skull" transform={skullXf} clipPath={url('skull')}>
              <path d={skin.head} fill={p.skinShade} />
              <path d={skin.head} fill={p.skin} transform={`translate(${-SHADE_SIDE * CRESCENT.dx} ${-CRESCENT.dy})`} />
            </g>
          ) : (
            <g data-part="skull" filter={url('lit')} transform={skullXf}>
              <path d={skin.head} fill={url('face')} />
            </g>
          )}

          <Face pose={pose} phys={phys} skin={skin} />

          {skin.hairFront && (
            <g filter={clay ? url('clayDrop') : flat ? undefined : url('drop')} transform={`translate(${turn * 10} ${nod * 5})`}>
              {clay ? <g filter={url('clayHair')}>{skin.hairFront}</g> : skin.hairFront}
            </g>
          )}
          {skin.faceExtras && <g transform={faceXf}>{skin.faceExtras}</g>}
        </g>

        {skin.neckExtras}
        <Arm side="L" pose={pose} skin={skin} url={url} />
        <Arm side="R" pose={pose} skin={skin} url={url} />
      </Body>
    </svg>
  )
}
