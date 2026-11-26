import { motion } from 'framer-motion'
import { colors, easing } from '@/design/tokens'
import { useInstant } from '@/motion/instant'

/**
 * YAML in 60 seconds, for a room that writes Python.
 *
 * The TR's whole claim is that YAML is two rules they already know: `key: value`
 * pairs like a dictionary, and indentation for nesting like a Python block. So
 * the figure puts the YAML beside the Python it means and draws the equivalence,
 * rather than describing YAML on its own terms.
 *
 * The two panels are line-aligned deliberately: row 1 of the YAML sits at the same
 * height as row 1 of the Python, so the eye pairs them without needing arrows for
 * every line. One connector is drawn, on the nested row, because nesting is the
 * rule that actually trips people.
 */

const YAML = [
  { text: 'person:', indent: 0 },
  { text: 'name: Ravi', indent: 1 },
  { text: 'skills:', indent: 1 },
  { text: '- python', indent: 2 },
  { text: '- react', indent: 2 },
  /* Two blank rows, pairing with Python's `]` and `}`. YAML closes a block by
     dedenting, so there is nothing to write here, and that absence IS the
     comparison the slide is making. */
  { text: '', indent: 0 },
  { text: '', indent: 0 },
]

const PY = [
  { text: 'person = {', indent: 0 },
  { text: '"name": "Ravi",', indent: 1 },
  { text: '"skills": [', indent: 1 },
  { text: '"python",', indent: 2 },
  { text: '"react",', indent: 2 },
  /*
    THE TWO CLOSING LINES ARE NOT OPTIONAL, and they were missing.

    The panel is captioned "Python you already write" and showed a dict literal
    that opened a brace and a bracket and closed neither. On the one slide whose
    argument is that YAML is a format they can already read, the exhibit was not
    a thing anyone could run. YAML's own panel is padded with two blank rows so
    the two panels stay the same height and every line still pairs with the line
    opposite it, which is the alignment the header comment above depends on.
  */
  { text: ']', indent: 1 },
  { text: '}', indent: 0 },
]

function Panel({
  title,
  lines,
  keyColor,
  instant,
  delay,
}: {
  title: string
  lines: { text: string; indent: number }[]
  keyColor: string
  instant: boolean
  delay: number
}) {
  return (
    <motion.div
      className="w-[248px] rounded-card border-2 bg-white p-2.5"
      style={{ borderColor: colors.line }}
      initial={instant ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: instant ? 0 : delay, ease: easing.soft }}
    >
      <div className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: colors.muted }}>
        {title}
      </div>
      <div className="space-y-0">
        {lines.map((l, i) => (
          <div
            key={i}
            className="font-mono text-body-sm font-semibold"
            style={{ paddingLeft: l.indent * 16, color: l.indent === 0 ? keyColor : colors.ink, height: 18 }}
          >
            {l.text}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export function YamlNesting({ className = '' }: { className?: string }) {
  const instant = useInstant()

  return (
    <div className={className}>
      <div className="flex items-start gap-4">
        <Panel title="YAML" lines={YAML} keyColor={colors.brandDark} instant={instant} delay={0.1} />

        <motion.div
          className="flex h-[174px] w-[104px] shrink-0 items-center justify-center"
          initial={instant ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: instant ? 0 : 0.5 }}
        >
          <span className="text-body-lg font-bold" style={{ color: colors.teal }}>
            means
          </span>
        </motion.div>

        <Panel title="The Python you already write" lines={PY} keyColor={colors.tealDark} instant={instant} delay={0.3} />
      </div>

      {/* The two rules, stated as rules, because the panels show them but do not
          name them. */}
      <div className="mt-2 flex gap-3">
        {[
          { rule: 'key: value', gloss: 'a pair, like a dictionary' },
          { rule: 'indentation', gloss: 'nesting, like a Python block' },
        ].map((r, i) => (
          <motion.div
            key={r.rule}
            className="flex-1 rounded-lg px-3 py-1.5"
            style={{ background: colors.surface2 }}
            initial={instant ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: instant ? 0 : 0.7 + i * 0.12, ease: easing.soft }}
          >
            <div className="font-mono text-body-sm font-bold" style={{ color: colors.brandDark }}>
              {r.rule}
            </div>
            <div className="text-xs font-semibold" style={{ color: colors.body }}>
              {r.gloss}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
