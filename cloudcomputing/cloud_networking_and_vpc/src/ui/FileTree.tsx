import { useState, type ReactNode } from 'react'
import { RevealGroup, Reveal } from '@/motion/Reveal'
import { iconByName } from './icons'
import { colors } from '@/design/tokens'

/**
 * A project folder, drawn.
 *
 * WHY THIS EXISTS. Session 2 asks the learner to create four files, and a slide
 * that shows a file's *contents* never says where the file goes. "Create a file
 * called Dockerfile" is not an instruction until it says which folder, and
 * "capital D, no extension" only makes sense next to the other names in the same
 * folder. This figure is the answer to "where does this go", and it appears
 * every time a new file is introduced so the room watches the project fill up.
 *
 * `state` is what makes it teach rather than decorate:
 *
 *   `new`      the file this slide is asking them to create (brand, tagged)
 *   `existing` already there from an earlier slide (quiet grey)
 *   `later`    named but not created yet (dashed ghost)
 *
 * Rows reveal on entry, never on a click: the tree is the visual half of a
 * text-and-visual pair, and those arrive together.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FOLDERS OPEN AND SHUT, AND ONLY ONE IS OPEN AT A TIME.
 *
 * The first version drew every row as a sibling in one flat stack, with a child
 * distinguished from its parent by 22px of indentation and nothing else. On the
 * session 4 workspace slide that produced fourteen rows of near-identical
 * monospace, and the review read it as one list rather than as three folders:
 *
 *   > "in file Tree make a new design to replicate to show the file inside the
 *      folder when those are expanded. initial state should have backend
 *      frontend and docker-demo, only we can expand one at a time"
 *
 * So `open` names the ONE folder whose contents are showing. Its children are
 * drawn INSIDE it — in a recessed well with its own rail, indented from the
 * folder's own border — so the containment is a drawn fact rather than an
 * inference from whitespace. Every other folder collapses to a single row with
 * a shut chevron and a count of what is in it, which is also the honest picture
 * of a file explorer the room uses every day.
 *
 * One at a time is a teaching constraint, not a technical one. A tree with three
 * folders open is the flat list again with extra lines, and the slide that needs
 * to point at `requirements.txt` cannot afford the other eight rows.
 *
 * IT IS AN ACCORDION, NOT A FIXED STATE. `open` names the folder that starts
 * open, and the presenter can click any other folder row to move to it: opening
 * one shuts whatever was open, and there is no all-shut state, so the figure can
 * never collapse to three bare rows mid-session. The height is reserved for the
 * tallest folder, so nothing on the slide moves when the open folder changes.
 *
 * `open` is OPTIONAL, and omitting it keeps the old behaviour exactly: every
 * folder expanded, no chevrons, no counts, no click targets. Sessions 2 and 3
 * are signed off and must render unchanged.
 */

export type FileState = 'new' | 'existing' | 'later'

export interface FileEntry {
  name: string
  /** Small right-aligned annotation, e.g. what the file is for. */
  note?: ReactNode
  state?: FileState
  /** Renders the folder glyph instead of the file glyph. */
  folder?: boolean
  /**
   * Indent level, 0 by default.
   *
   * Needed because the session's demo folder is a sibling of the learner's real
   * `backend` and `frontend` folders, and "where does this go" is only answered
   * by showing it next to them.
   *
   * It is also how `open` groups the tree: a row with `depth > 0` belongs to the
   * nearest depth-0 folder above it.
   */
  depth?: number
}

/*
  EVERY ROW IS A LIT SURFACE (STYLE_GUIDE section 9).

  These were three flat fills with a coloured left rail, which made the whole
  figure the flattest object on any slide that also carried a `Terminal`. Each
  state now takes the standard four-part treatment at the amplitude its job
  wants: `new` is the loudest because it is the row the slide is about, `later`
  is flattest and takes no drop shadow at all because it is a row that does not
  exist yet.

  The shadow is tinted with the row's OWN accent rather than with neutral black,
  which is what keeps a brand row and a grey row telling each other apart at the
  back of the room.
*/
const STATE: Record<
  FileState,
  { bg: string; border: string; text: string; dashed?: boolean; glow?: string }
> = {
  new: {
    bg: [
      'radial-gradient(120% 200% at 6% 0%, #FFFFFFcc 0%, #FFFFFF00 62%)',
      `linear-gradient(135deg, #F2F6FF 0%, #EAF1FF 52%, #DCE8FF 100%)`,
    ].join(', '),
    border: colors.brand,
    text: colors.brandDark,
    glow: [
      `0 2px 8px -4px ${colors.brand}59`,
      'inset 0 1px 0 0 #FFFFFF',
      `inset 0 -1px 0 0 ${colors.brand}1f`,
    ].join(', '),
  },
  existing: {
    bg: 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 58%, #F7FAFE 100%)',
    border: colors.line,
    text: colors.body,
    glow: `inset 0 1px 0 0 #FFFFFF, inset 0 -1px 0 0 ${colors.brandDeep}0f`,
  },
  later: {
    bg: 'transparent',
    border: colors.line,
    text: colors.muted,
    dashed: true,
  },
}

/** A depth-0 entry and the rows that live inside it. */
interface Group {
  head: FileEntry
  children: FileEntry[]
}

/**
 * Fold the flat `entries` list into top-level rows plus their children.
 *
 * The flat-with-`depth` shape is kept on purpose: it is what every existing deck
 * passes, and a nested `children` array would have been a breaking change to a
 * component three signed-off sessions render.
 */
function group(entries: FileEntry[]): Group[] {
  const out: Group[] = []
  for (const e of entries) {
    if (!e.depth || out.length === 0) out.push({ head: e, children: [] })
    else out[out.length - 1].children.push(e)
  }
  return out
}

export function FileTree({
  root,
  entries,
  caption,
  width,
  /**
   * The folder that starts open. Omit it and every folder renders expanded, with
   * no chevrons and no counts, which is what sessions 2 and 3 already ship.
   *
   * Passing it also makes the tree CLICKABLE: see the accordion note below.
   */
  open,
  className = '',
}: {
  /** The folder path, shown in the header row. */
  root: string
  entries: FileEntry[]
  caption?: ReactNode
  width?: number
  open?: string
  className?: string
}) {
  const Folder = iconByName.folder
  const FolderOpen = iconByName['folder-open']
  const File = iconByName.file
  const ChevronRight = iconByName['chevron-right']
  const ChevronDown = iconByName['chevron-down']

  const groups = group(entries)
  /* No `open` prop means the old behaviour: nothing collapses, so nothing needs
     an affordance drawn on it either. */
  const collapsible = open !== undefined

  /*
    THE TREE IS AN ACCORDION, AND EXACTLY ONE FOLDER IS ALWAYS OPEN.

    `open` seeds the state rather than fixing it: the presenter can open any
    folder by clicking its row, and opening one shuts whatever was open, because
    the state is a single name and not a set. There is no "all shut" state, so
    the figure can never collapse to three bare rows in front of the room.

    Every folder row that has children is a real `<button>`, which is what makes
    this reachable by Tab and operable by Enter and Space without a keydown
    handler of our own. It does not intercept the arrow keys, so the deck's own
    slide and step navigation keeps working while a row has focus.
  */
  const [openNow, setOpenNow] = useState(open)

  /*
    THE FIGURE'S HEIGHT IS RESERVED, NOT DISCOVERED.

    Without this the well is exactly as tall as whatever folder happens to be
    open, so clicking from a five-child folder to a two-child one shrinks the
    whole figure and everything under it jumps up the slide. On a projector that
    reads as the slide breaking.

    So the well always reserves the tallest folder's worth of rows. The numbers
    are this component's own geometry: a nested row is 46px (py-2.5 on
    `text-body-sm` plus its 2px border) and carries a 6px gap below it except the
    last, and the well adds py-3 top and bottom.
  */
  const NESTED_ROW_H = 46
  const NESTED_GAP = 6
  const WELL_PAD = 24
  const maxChildren = groups.reduce((m, g) => Math.max(m, g.children.length), 0)
  const wellMinHeight =
    maxChildren > 0
      ? maxChildren * NESTED_ROW_H + (maxChildren - 1) * NESTED_GAP + WELL_PAD
      : undefined

  /** One row of the tree. `nested` rows sit inside an open folder's well. */
  function Row({
    e,
    nested = false,
    expanded,
    count,
    last = false,
    rounded = '',
  }: {
    e: FileEntry
    nested?: boolean
    /** `undefined` on anything that cannot be opened. */
    expanded?: boolean
    count?: number
    last?: boolean
    rounded?: string
  }) {
    const s = STATE[e.state ?? 'existing']
    const Glyph = e.folder ? (expanded ? FolderOpen : Folder) : File
    /* `expanded` is only ever defined on a folder that has children, so it is
       also the test for "this row does something when you click it". */
    const clickable = expanded !== undefined
    const Tag = clickable ? 'button' : 'div'
    return (
      <Tag
        type={clickable ? 'button' : undefined}
        onClick={clickable ? () => setOpenNow(e.name) : undefined}
        aria-expanded={clickable ? expanded : undefined}
        className={`flex w-full items-center gap-2.5 border-2 px-4 py-2.5 text-left ${
          nested ? 'rounded-lg' : `border-t-0 ${rounded}`
        } ${clickable ? 'cursor-pointer' : ''}`}
        style={{
          /* The vertical borders stay solid even on a `later` row: a dashed box
             inside a solid stack reads as a broken frame, so only the row's own
             fill and text carry the ghosting. */
          borderColor: colors.line,
          background: s.bg,
          borderLeftColor: s.dashed ? colors.line : s.border,
          borderLeftWidth: 4,
          boxShadow: s.glow,
          /* Nested rows are separate objects in a well rather than courses in a
             wall, so they need their own gap and their own full border. */
          marginBottom: nested && !last ? 6 : 0,
        }}
      >
        {collapsible && (
          <span className="grid w-4 shrink-0 place-items-center" aria-hidden>
            {expanded === undefined ? null : expanded ? (
              <ChevronDown width={15} height={15} style={{ color: colors.brand }} />
            ) : (
              <ChevronRight width={15} height={15} style={{ color: colors.muted }} />
            )}
          </span>
        )}
        {!collapsible && e.depth ? <span style={{ width: e.depth * 22 }} aria-hidden /> : null}
        <Glyph
          width={17}
          height={17}
          style={{ color: expanded ? colors.brand : s.text, opacity: expanded ? 1 : 0.75 }}
        />
        <span
          className="font-mono text-body-sm font-semibold"
          style={{ color: s.text, fontStyle: s.dashed ? 'italic' : undefined }}
        >
          {e.name}
        </span>
        {e.note && (
          <span className="ml-auto text-xs" style={{ color: colors.muted }}>
            {e.note}
          </span>
        )}
        {/* The count is what makes a shut folder honest: it says there is
            something in there without spending eleven rows saying what. It only
            appears when the folder has children AND no note is competing for the
            same slot. */}
        {expanded === false && count ? (
          <span
            className="ml-auto shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold"
            style={{
              background: `${colors.brand}12`,
              color: colors.muted,
              boxShadow: `inset 0 1px 0 0 #FFFFFF`,
            }}
          >
            {count} inside
          </span>
        ) : null}
        {/* Tag only the top-level new entry. When a new folder carries new
            files, tagging all three repeats one instruction three times
            and the eye stops reading the tag at all. The children stay
            brand-coloured, which is enough to group them. */}
        {e.state === 'new' && !e.depth && (
          <span
            className="ml-auto rounded-pill px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
            style={{
              /* The tag is the loudest thing in the figure, so it carries the
                 solid-surface amplitude: a ramp that starts above `brand`, and a
                 hairline along its top edge. */
              background: `linear-gradient(135deg, #4C7AFD 0%, ${colors.brand} 46%, ${colors.brandDark} 100%)`,
              boxShadow: `0 2px 6px -2px ${colors.brandDeep}66, inset 0 1px 0 0 #FFFFFF59`,
            }}
          >
            create this
          </span>
        )}
      </Tag>
    )
  }

  return (
    <div className={className} style={width ? { width } : undefined}>
      <RevealGroup className="block" stagger={0.08}>
        <Reveal dir="up">
          <div
            className="flex items-center gap-2.5 rounded-t-card border-2 border-b-0 px-4 py-2.5"
            style={{
              borderColor: colors.line,
              /* The path bar is the lip of the panel, so it is lit like one. */
              background: [
                'radial-gradient(120% 160% at 10% 0%, #FFFFFF 0%, #FFFFFF00 66%)',
                'linear-gradient(135deg, #F5F8FC 0%, #F1F5F9 55%, #E6EDF6 100%)',
              ].join(', '),
              boxShadow: `inset 0 1px 0 0 #FFFFFF, inset 0 -1px 0 0 ${colors.brandDeep}14`,
            }}
          >
            <Folder width={18} height={18} style={{ color: colors.body }} />
            <span className="font-mono text-body-sm font-semibold" style={{ color: colors.ink }}>
              {root}
            </span>
          </div>
        </Reveal>

        {/*
          NO `open` MEANS THE OLD RENDERING, LINE FOR LINE.

          Not "the same rows without chevrons" -- the same MARKUP. The first cut
          of this component ran every tree through the grouped path and only
          suppressed the chevrons when `open` was absent, so a legacy tree's
          children still went into the recessed well. That is a layout change,
          and it moved a slide in session 4 far enough to fail
          `video-safe.mjs` on a deck nobody had edited. Sessions 2 and 3 are
          signed off; a component they render must not move under them.

          So the two paths are separate, and this one is the original.
        */}
        {!collapsible
          ? entries.map((e, i) => (
              <Reveal dir="up" key={i}>
                <Row e={e} last={i === entries.length - 1} rounded={i === entries.length - 1 ? 'rounded-b-card' : ''} />
              </Reveal>
            ))
          : groups.map((g, gi) => {
              const isFolder = !!g.head.folder && g.children.length > 0
              const expanded = isFolder ? g.head.name === openNow : undefined
              const lastGroup = gi === groups.length - 1
              const showChildren = g.head.name === openNow
              const roundBottom = lastGroup && (!showChildren || g.children.length === 0)

              return (
                <div key={gi} className="block">
                  <Reveal dir="up">
                    <Row
                      e={g.head}
                      expanded={expanded}
                      count={g.children.length}
                      rounded={roundBottom ? 'rounded-b-card' : ''}
                    />
                  </Reveal>

                  {showChildren && g.children.length > 0 && (
                    /*
                      THE WELL. This is the whole point of the redesign: the
                      children are drawn inside a recessed container that belongs
                      to the folder above them, so "inside" is a picture rather
                      than an inference from whitespace.

                      Recessed means the light source is inverted -- a dark
                      hairline on the TOP edge, a white one on the bottom -- which
                      is the standard way a surface reads as cut into the panel
                      rather than sitting on it. The rail down the left is the
                      same trick a file explorer uses.
                    */
                    <div
                      className={`border-2 border-t-0 px-3 py-3 pl-7 ${
                        lastGroup ? 'rounded-b-card' : ''
                      }`}
                      style={{
                        minHeight: wellMinHeight,
                        borderColor: colors.line,
                        background: 'linear-gradient(180deg, #EEF3FA 0%, #F5F8FC 100%)',
                        boxShadow: [
                          `inset 0 2px 5px -2px ${colors.brandDeep}1f`,
                          'inset 0 -1px 0 0 #FFFFFF',
                        ].join(', '),
                      }}
                    >
                      <div
                        className="relative"
                        style={{
                          /* The rail. It stops at the last child rather than
                             running to the floor of the well, so it reads as a
                             bracket around the contents and not as a border. */
                          borderLeft: `2px solid ${colors.brand}33`,
                          paddingLeft: 14,
                        }}
                      >
                        {g.children.map((c, ci) => (
                          <Reveal dir="up" key={ci}>
                            <Row e={c} nested last={ci === g.children.length - 1} />
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
      </RevealGroup>
      {caption && (
        <p className="mt-2.5 text-center text-body-sm leading-snug text-body">{caption}</p>
      )}
    </div>
  )
}
