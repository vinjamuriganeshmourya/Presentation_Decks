import type { ReactNode } from 'react'
import type { IconName } from '@/ui/icons'
import type { Tone } from '@/design/tokens'

/**
 * THE FLOW FIGURE CONTRACT.
 *
 * Promoted from `slide-kit/flow-lab` after the user picked `BoundaryBridge` out
 * of four candidates. The lab still holds the three runners-up and the notes on
 * why each lost; this file and `BoundaryBridge.tsx` are what the sessions use.
 *
 * Every variant in this folder takes exactly these props, so choosing one is a
 * one-word edit at the call site and not a rewrite of the slide. The contract is
 * deliberately about MEANING, not geometry: a station says what it is in the
 * story (`source`, `hub`, `target`), never where it should be drawn, because
 * that is the decision each variant exists to make differently.
 *
 * The figure being replaced is the kit's `FlowChart`, which draws boxes and one
 * arrow glyph between them. It cannot say what travels along an edge, cannot
 * label an edge at all, and gives a registry in the middle exactly the same
 * weight as the laptop on the left. Session 6's slide 20 needed all three.
 */

/**
 * The mark beside a station. Every name here MUST have a real PNG in
 * `slide-kit/assets/tech/`, and a matching row in `LOGO_SRC` in each variant.
 *
 * `github` and `jenkins` were added for Deployment session 7, whose architecture
 * chain is Developer, GitHub, Jenkins, Docker Hub, EC2. `git` and `github` are
 * deliberately separate: one is the tool and one is the service, and session 7
 * names both on the same slide.
 */
export type StationLogo =
  | 'docker'
  | 'git'
  | 'github'
  | 'jenkins'
  | 'python'
  | 'nodejs'
  | 'makefile'

export interface FlowStation {
  label: ReactNode
  /** One short line under the label. Not a sentence, and never a full stop. */
  caption?: ReactNode
  /** A technology mark. Rule 12: a named technology carries its logo. */
  logo?: StationLogo
  /** Used only when there is no logo. */
  icon?: IconName
  /**
   * What this station IS in the story, which is what earns it visual weight:
   * `source` is where the thing starts, `hub` is the shared place in the
   * middle, `target` is any machine that receives. A variant is free to draw
   * a `hub` larger, higher, or centred, and that choice is the variant.
   */
  kind?: 'source' | 'hub' | 'target'
  tone?: Tone
}

export interface FlowLeg {
  /** What travels, as the command that moves it: `docker push`. */
  label: ReactNode
  /** Optional gloss under the label: `once per release`. */
  sub?: ReactNode
  /**
   * WHO TYPES THE COMMAND. IT NEVER TURNS THE PAYLOAD ARROW AROUND.
   *
   * This field has now been wrong twice, so the physics is written out here.
   *
   *   docker push   the image data moves laptop  -> Docker Hub, and the laptop
   *                 is what runs the command
   *   docker pull   the image data moves Docker Hub -> machine, and the MACHINE
   *                 is what runs the command
   *
   * The data travels the same way in both cases: along the chain, in story
   * order, always. The only thing that differs is which end issued the command.
   * `left` means the station before the leg issued it, `right` means the station
   * after the leg did.
   *
   * SO: A VARIANT MUST NEVER DRAW A PAYLOAD ARROW POINTING BACK UP THE CHAIN.
   * Three of the four first-pass variants drew `docker pull` with its arrowhead
   * aimed at the hub, which tells the room the image travels from the machine
   * INTO Docker Hub, the exact opposite of what a pull does. That is what this
   * rewrite exists to stop.
   *
   * A figure MAY show who asked, and should, because it is the difference
   * between the two commands. It has to be visibly subordinate to the payload
   * arrow: a hairline, a dashed return, a small caption. Never a second
   * full-weight arrow, and never the only arrow on the leg.
   */
  issuedBy?: 'left' | 'right'
}

export interface FlowFigureProps {
  /** In story order. `legs[i]` joins `stations[i]` to `stations[i + 1]`. */
  stations: FlowStation[]
  legs: FlowLeg[]
  /** One line under the whole figure, for the claim the picture makes. */
  caption?: ReactNode
  className?: string
}
