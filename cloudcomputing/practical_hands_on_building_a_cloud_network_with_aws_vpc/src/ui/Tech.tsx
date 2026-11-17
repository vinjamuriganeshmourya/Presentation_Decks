import type { StationLogo } from './flowFigure'

/*
  A TECHNOLOGY LOGO WITH ITS NAME BESIDE IT, SAFE TO USE MID-SENTENCE.

  Content rule 12 says every technology named on a slide carries its logo, so
  every deck needs this. It lived in four session decks before it lived here,
  and three of those four shipped with the bug this file exists to prevent.

  WHY NOT `inline-flex`

  The obvious implementation is `<span className="inline-flex items-center
  gap-2">`, and it is wrong inside a sentence. An inline-flex box aligns its
  BOTTOM edge to the surrounding text baseline, so the logo AND its label both
  ride below the words either side of them: a callout reading "Docker Hub works
  both ways" renders with the first two words visibly dropped. Sessions 3, 4, 6
  and 7 all did this; session 6's review called it out, and session 5 had
  already fixed it locally without the fix reaching anyone else.

  WHAT WORKS

  Plain inline flow. The label is ordinary inline text, so it shares the
  paragraph's baseline with whatever follows it. Only the image is nudged, down
  a fifth of an em, so its optical centre lands on the x-height rather than on
  the baseline. `whitespace-nowrap` keeps the mark and its word from being split
  across a line break.

  The mark supports the label, it never replaces it: a logo alone is not a name
  to a learner who has not met the technology yet (content rule 12, and
  `TEXT_GUIDELINES.md` section 3b).
*/

const LOGO_SRC: Record<StationLogo, string> = {
  docker: '/assets/tech/docker.png',
  git: '/assets/tech/git.png',
  github: '/assets/tech/github.png',
  jenkins: '/assets/tech/jenkins.png',
  python: '/assets/tech/python.png',
  nodejs: '/assets/tech/nodejs.png',
  makefile: '/assets/tech/makefile.png',
}

export function Tech({
  name,
  label,
  size = 20,
}: {
  name: StationLogo
  /** The technology's name. Omit only when an adjacent line already names it. */
  label?: string
  size?: number
}) {
  return (
    <span className="whitespace-nowrap">
      <img
        src={LOGO_SRC[name]}
        alt=""
        draggable={false}
        style={{ height: size, width: size, verticalAlign: '-0.2em' }}
        className="mr-1.5 inline-block object-contain"
      />
      {label ? <span>{label}</span> : null}
    </span>
  )
}
