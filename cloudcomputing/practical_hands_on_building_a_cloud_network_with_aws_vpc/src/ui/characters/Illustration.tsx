import { motion } from 'framer-motion'
import { Nova, type NovaPose, type Facing } from './Nova'
import { QuestionMark, ChecklistCard, PracticePad } from './props'
import { ConceptApi, ConceptDatabase } from './concepts'
import { TwoAppsScene, CorsGate, EnvConfig, Toolchain, PortsDoors, OriginFlats } from './session1'
import { AI_CHARACTER_ASSETS } from './manifest'

export type IllustrationName =
  | 'nova-wave'
  | 'nova-point'
  | 'nova-idea'
  | 'nova-cheer'
  | 'nova-neutral'
  | 'quiz'
  | 'practice'
  | 'feedback'
  | 'recap'
  | 'concept-api'
  | 'concept-database'
  | 'two-apps'
  | 'cors-gate'
  | 'env-config'
  | 'toolchain'
  | 'ports-doors'
  | 'origin-flats'

const NOVA_POSES: Partial<Record<IllustrationName, NovaPose>> = {
  'nova-wave': 'wave',
  'nova-point': 'point',
  'nova-idea': 'idea',
  'nova-cheer': 'cheer',
  'nova-neutral': 'neutral',
}

/**
 * The single "character slot" used across all slides. Renders the built-in
 * vector character/scene for `name`, unless an AI-generated asset is
 * registered in the manifest (then that image is used instead).
 */
export function Illustration({
  name,
  className,
  float = true,
  facing = 'left',
}: {
  name: IllustrationName
  className?: string
  float?: boolean
  /** Which way the character gestures. Defaults to "left" (toward content). */
  facing?: Facing
}) {
  const asset = AI_CHARACTER_ASSETS[name]
  if (asset) {
    return (
      <motion.img
        src={asset}
        alt=""
        aria-hidden
        className={className}
        style={{ objectFit: 'contain', transform: facing === 'right' ? 'scaleX(-1)' : undefined }}
        animate={float ? { y: [0, -10, 0] } : undefined}
        transition={float ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    )
  }

  const pose = NOVA_POSES[name]
  if (pose) return <Nova pose={pose} facing={facing} className={className} float={float} />

  switch (name) {
    case 'quiz':
      return (
        <Scene className={className}>
          <QuestionMark className="absolute right-0 top-2 h-[74%]" />
          {/*
            Anchored from the BOTTOM, not centred with `-translate-y-1/2`. Nova's
            float animation writes an inline `transform` every frame, which
            replaces the utility translate outright, so a centred Nova silently
            rendered a half-height too low and hung out of the scene.
          */}
          <Nova pose="point" facing={facing} float={float} className="absolute bottom-[6%] left-0 h-[80%]" />
        </Scene>
      )
    /*
      PRACTICE is an OBJECT; FEEDBACK keeps the character.

      Practice used to pair Nova with a laptop, which put two figures in the same
      corner of a night slide and left neither reading at projection distance.
      One notepad, drawn large, says "your turn" faster than a mascot holding
      something does.

      Feedback is the opposite case and keeps the character: asking the room for
      something is the one moment the deck should have a face in it. It is Nova
      on its own there, with no prop at all. `FeedbackBubble` in `props.tsx` is
      the object-only version, kept but not wired up.
    */
    case 'practice':
      return (
        <Float className={className} float={float}>
          <PracticePad className="h-full w-auto" />
        </Float>
      )
    case 'feedback':
      /*
        Nova alone. The star bubble that used to sit beside it is gone: five
        stars are a RATING widget, and this slide is not asking for a score, it
        is asking the room to say something. The prop also had to be recoloured
        away from its orange to survive the navy stage, at which point it was a
        washed-out five-pointed row carrying no meaning the headline did not
        already carry. `StarBubble` is still in `props.tsx` if a rating slide
        ever needs it.
      */
      return (
        <Scene className={className}>
          {/*
            Nova is ABSOLUTE inside the scene box, not in flow.

            In flow it was sized `h-[60%]` against a grid row that sizes to its
            content, which is circular: the row grew to Nova's intrinsic height,
            the `h-full` container grew with it, and the slide overflowed its own
            frame by 31px. `qa.mjs` caught it. Absolute positioning takes Nova
            out of that loop, and the scene box keeps its aspect ratio.

            Centred with `left-0 right-0 mx-auto`, never `-translate-x-1/2`:
            Nova's float writes an inline transform every frame, which replaces
            the utility translate outright.
          */}
          <Nova
            pose="wave"
            facing={facing}
            float={float}
            className="absolute bottom-0 left-0 right-0 mx-auto h-[94%] w-auto"
          />
        </Scene>
      )
    case 'recap':
      return (
        <Scene className={className}>
          <ChecklistCard className="absolute right-0 top-1/2 h-[84%] -translate-y-1/2" />
          {/* Bottom anchored for the same reason as the quiz scene: the float
              animation's inline transform overrides a utility translate. */}
          <Nova pose="point" facing={facing} float={float} className="absolute bottom-[5%] left-0 h-[82%]" />
        </Scene>
      )
    case 'concept-api':
      return <ConceptApi className={className} />
    case 'concept-database':
      return <ConceptDatabase className={className} />
    case 'two-apps':
      return <TwoAppsScene className={className} />
    case 'cors-gate':
      return <CorsGate className={className} />
    case 'env-config':
      return <EnvConfig className={className} />
    case 'toolchain':
      return <Toolchain className={className} />
    case 'ports-doors':
      return <PortsDoors className={className} />
    case 'origin-flats':
      return <OriginFlats className={className} />
    default:
      return <Nova pose="neutral" facing={facing} className={className} float={float} />
  }
}

/**
 * A prop that breathes, on the same 5.5s cycle the AI-asset branch and Nova use,
 * so an object-only slide is not the one still frame in a deck of moving ones.
 */
function Float({
  children,
  className,
  float,
}: {
  children: React.ReactNode
  className?: string
  float: boolean
}) {
  return (
    <motion.div
      className={`relative ${className ?? ''}`}
      animate={float ? { y: [0, -10, 0] } : undefined}
      transition={float ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {children}
    </motion.div>
  )
}

/**
 * A two-piece scene: a character and a prop, both absolutely positioned.
 *
 * THE ASPECT RATIO IS LOAD-BEARING. Every child here is absolute, so the box has
 * no intrinsic width, and every call site sizes it as `h-[60%] w-auto` — which
 * resolves to a width of ZERO. Nova still showed, because it is sized in `h`,
 * but any prop sized in `w` (the star bubble, the checklist card) rendered at
 * zero width and silently vanished. `QuizTimeSlide` hit this and worked around
 * it by hardcoding a width at its own call site; fixing it here fixes it for
 * every scene instead.
 */
function Scene({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className ?? ''}`} style={{ aspectRatio: '4 / 3' }}>
      {children}
    </div>
  )
}
