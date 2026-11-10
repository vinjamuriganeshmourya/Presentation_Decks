import type { ReactNode } from 'react'

/**
 * ONE CONTRACT FOR EVERY PROJECT-CODE FIGURE.
 *
 * Same principle as the sibling labs: it describes **meaning** and never
 * geometry. Picking a winner is a rename at the call site.
 *
 * WHY THIS LAB IS SEPARATE FROM THE PSEUDOCODE ONE
 *
 * They look like the same problem and they are not. Pseudocode explanation is
 * about ONE algorithm: what does this logic do, and what happens when it runs.
 * Project-code explanation is about MANY FILES: where does this live, what calls
 * it, and what has to be true elsewhere for this line to make sense.
 *
 * A trace table answers the first question and is useless for the second. A file
 * map answers the second and is useless for the first. Two labs, because one
 * winner cannot serve both.
 *
 * WHAT THE KIT CANNOT DO TODAY
 *
 * `CodeBlock` shows one file. `CodeBuildSlide` shows one file growing. `FileTree`
 * shows the shape of a directory. Nothing connects them, so a walkthrough of four
 * files is four slides with no thread, and the room is asked to remember where
 * `serializers.py` sat while looking at `views.py`.
 *
 * WHAT THE LITERATURE ASKS FOR
 *
 * Walkthrough documentation is described as a GUIDED TOUR of a codebase, using
 * snippets as points of interest on a map, and its value is named as filling the
 * gap between low-level and high-level documentation. The three things it needs
 * are annotation (notes that clarify relationships), consistent colour per
 * module or layer, and the ability to move between levels of abstraction.
 *
 * So the unit of this contract is a STOP ON A TOUR, not a file. `files` is the
 * map; `stops` is the route.
 */

export interface CodeFile {
  /** Repo-relative, and the id other things refer to. */
  path: string
  /** For the highlighter and the chip. */
  language?: string
  /** The whole file as it stands, one entry per line, no trailing newline. */
  lines: string[]
  /** What this file is FOR, in one line. Shown when the map is drawn. */
  role?: string
  /**
   * Which architectural layer it belongs to.
   *
   * Colour per layer, held consistent across every figure, is the one thing the
   * literature is unanimous about: it is how a reader identifies a module
   * without reading its name each time.
   */
  layer?: string
}

export interface TourStop {
  id: string
  /** `CodeFile.path` of the file this stop is in. */
  file: string
  /**
   * The lines this stop is about, 1-based and inclusive.
   *
   * A RANGE rather than a whole file, deliberately. A stop that means "this file"
   * is not a stop, it is a chapter, and the room cannot look at 40 lines and know
   * which three the sentence was about.
   */
  range: [number, number]
  /** What the room should take from this stop. A claim, not a heading. */
  title: string
  /** One or two lines of why. */
  body?: ReactNode
  /** The aside the presenter reaches for when asked. Hover only. */
  detail?: ReactNode
  /**
   * What this stop hands to, if the tour follows a call or a value rather than a
   * reading order. `stops[i + 1]` is the default next stop, so this is only for
   * naming the MECHANISM of the handover: `docker push`, `HTTP GET`, `import`.
   */
  via?: string
}

/**
 * ONE ORDERING OF THE SAME FILES, AND WHY THERE HAS TO BE MORE THAN ONE.
 *
 * The route this lab was built around is the REQUEST's path: a GET arrives at
 * `urls.py`, is dispatched to `views.py`, which asks `serializers.py` to turn
 * `models.py` rows into JSON. That is the right order for explaining what happens.
 *
 * It is the WRONG order for writing the code. Nobody writes `urls.py` first: a
 * route needs a view to point at, a view needs a serializer, and a serializer
 * names fields that have to exist on a model. Writing order runs the other way,
 * models to urls, and a learner told only the request order will sit down to build
 * their own app and start at the end.
 *
 * So the two orders are BOTH taught, and they are two authored routes rather than
 * one route drawn backwards. A reversal would be a lie in three places at once:
 *
 *   1. `via` names the MECHANISM of a handover, and a mechanism has a direction.
 *      "GET /api/products/" is not what `views.py` hands to `urls.py`.
 *   2. `title` is a CLAIM about why the room is looking at this stop, and the
 *      claim differs: the model is "where it all resolves" when you are following
 *      a request, and "start with what a product IS" when you are writing one.
 *   3. Two stops in one file do not reverse. The request reaches the view, then
 *      the queryset line inside it; you WRITE the function, then the line inside
 *      it. Same order, both times, in the middle of a reversal.
 *
 * Authored, therefore, in the same way `real.map` is authored in the pseudocode
 * lab: because it is a claim about correspondence, and a figure that guessed it
 * would quietly teach the wrong thing.
 */
export interface TourRoute {
  /** `request` and `code` are the two this course needs. */
  id: string
  /** What the toggle says. Two or three words. */
  label: string
  /** One line: what this ORDER claims. Variants show it in place of the caption. */
  claim?: string
  stops: TourStop[]
}

export interface ProjectFigureProps {
  files: CodeFile[]
  /**
   * The route, in the order the room should walk it.
   *
   * Still required, and still the one a figure draws when it ignores `routes`
   * entirely. When `routes` is given, this must be `routes[0].stops`.
   */
  stops: TourStop[]
  /**
   * The orderings the room can switch between, `routes[0]` being the default.
   *
   * Optional: a figure with one honest order should not have to invent a toggle,
   * and a toggle with one entry is a button that does nothing.
   */
  routes?: TourRoute[]
  /** Which stop is current, for a variant that shows one at a time. */
  at?: number
  caption?: ReactNode
  className?: string
}

export interface ResolvedProject {
  files: CodeFile[]
  stops: TourStop[]
  /** Always at least one, so a variant never branches on whether routes exist. */
  routes: TourRoute[]
  /**
   * The most stops any route has.
   *
   * A variant registers its build steps with the deck's `Stepper` through
   * `useBeats(count)`, and that count MUST NOT change while the slide is up: the
   * arrow key would advance to the next slide instead of building this one. The
   * route is chosen by a click, so `stops.length` is state as far as the beat
   * count is concerned, and this is the number to use instead.
   */
  stopCount: number
  byPath: Record<string, CodeFile>
  /** Layers in first-appearance order, so colour assignment is stable. */
  layers: string[]
  /** The snippet a stop points at, already sliced. */
  snippet: (stop: TourStop) => { lines: string[]; from: number; language?: string }
  problems: string[]
}

/**
 * Resolve once, so the variants disagree about geometry only.
 *
 * Every check here is a mistake that renders as something plausible. A stop
 * pointing past the end of a file draws an empty panel; a range of the whole file
 * draws a wall of code the sentence does not match.
 */
export function resolveProject({
  files,
  stops,
  routes,
}: Pick<ProjectFigureProps, 'files' | 'stops' | 'routes'>): ResolvedProject {
  const problems: string[] = []
  const byPath: Record<string, CodeFile> = {}
  for (const f of files) {
    if (byPath[f.path]) problems.push(`file "${f.path}" declared twice`)
    byPath[f.path] = f
  }

  const layers: string[] = []
  for (const f of files) {
    const l = f.layer ?? 'unassigned'
    if (!layers.includes(l)) layers.push(l)
  }

  /*
    ONE ROUTE WHEN NOTHING SAYS OTHERWISE, so no variant has to ask whether the
    figure it is drawing has a toggle.
  */
  const allRoutes: TourRoute[] =
    routes && routes.length > 0
      ? routes
      : [{ id: 'default', label: 'The route', stops }]

  if (routes && routes.length > 0 && routes[0].stops !== stops) {
    problems.push('the first route must be the same array as `stops`, which is what a figure draws when it ignores the toggle')
  }
  /*
    EVERY ROUTE HAS TO BE THE SAME LENGTH, and this is not tidiness.

    The number of build steps a figure registers with the deck cannot change while
    the slide is up, and switching route is a click. Two routes of different
    lengths would either strand a click on nothing or lose the tail of the longer
    one, and both of those read to a presenter as a figure that has stopped
    responding.
  */
  for (const r of allRoutes.slice(1)) {
    if (r.stops.length !== allRoutes[0].stops.length) {
      problems.push(
        `route "${r.id}" has ${r.stops.length} stops and "${allRoutes[0].id}" has ${allRoutes[0].stops.length}; the toggle cannot change how many build steps the slide registers`,
      )
    }
  }

  /* Named per route, because "stop 7" means nothing once there are two routes of
     five and the author has to find which one is wrong. */
  for (const r of allRoutes) {
    const where = allRoutes.length > 1 ? ` of route "${r.id}"` : ''
    for (const [i, s] of r.stops.entries()) {
      const f = byPath[s.file]
      if (!f) {
        problems.push(`stop ${i + 1}${where} is in "${s.file}", which is not in files`)
        continue
      }
      const [a, b] = s.range
      if (a < 1 || b > f.lines.length) {
        problems.push(`stop ${i + 1}${where} wants lines ${a} to ${b} of "${s.file}", which has ${f.lines.length}`)
      }
      if (a > b) problems.push(`stop ${i + 1}${where} has an inverted range`)
      if (b - a > 11) {
        problems.push(`stop ${i + 1}${where} spans ${b - a + 1} lines; past a dozen the room cannot tell which the sentence was about`)
      }
    }
  }
  for (const r of allRoutes) {
    if (r.stops.length > 6) {
      problems.push(`route "${r.id}" has ${r.stops.length} stops; past six this is a chapter, not a slide`)
    }
  }

  return {
    files,
    stops,
    routes: allRoutes,
    stopCount: Math.max(0, ...allRoutes.map((r) => r.stops.length)),
    byPath,
    layers,
    snippet: (stop) => {
      const f = byPath[stop.file]
      if (!f) return { lines: [], from: stop.range[0] }
      return {
        lines: f.lines.slice(stop.range[0] - 1, stop.range[1]),
        from: stop.range[0],
        language: f.language,
      }
    },
    problems,
  }
}
