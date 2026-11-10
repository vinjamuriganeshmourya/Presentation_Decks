/**
 * BABEL PLUGIN — stamps every DOM element with the component that rendered it.
 *
 * Used only by `vite.review.config.ts`, which builds the deck for the review app
 * (`node review.mjs`). The shipped deck — `npm run build:html` — never runs this,
 * so the file an instructor opens carries none of these attributes.
 *
 * Each lowercase (real DOM) JSX element gains two attributes:
 *
 *   data-ui="CodeBlock"                      the component whose body contains it
 *   data-ui-loc="src/ui/CodeBlock.tsx:84"    where that element is authored
 *
 * WHY A BUILD-TIME TRANSFORM RATHER THAN MARKERS WRITTEN INTO THE COMPONENTS.
 * The obvious version of this feature is to hand-add `data-ui="Callout"` to each
 * component's root element. It does not survive contact with this kit: a great
 * many components return another COMPONENT as their root — `ContentSlide` returns
 * `<SlideBase>`, `Callout`'s stepped branch returns `<Step>` — and a `data-ui`
 * prop on a component is not an attribute. It either vanishes (the component does
 * not forward unknown props) or fails typecheck (its props type does not admit
 * it). It would also have to be re-added by hand to every component written from
 * here on, and would be silently forgotten.
 *
 * Marking DOM elements from the inside is exact in a way the hand-written version
 * is not, because the enclosing function is read from the syntax tree rather than
 * from a string somebody typed.
 *
 * EVERY DOM ELEMENT IS MARKED, not just each component's root. The review app
 * walks UP from whatever the reviewer clicked to the nearest `data-ui`, so marking
 * all of them means the innermost mark wins and the comment names the component
 * that actually owns that piece of the slide — and `data-ui-loc` points at the
 * clicked element's own line, not at its component's first line. A comment on the
 * third row of a table therefore lands on the row.
 *
 * `motion.*` elements ARE marked. framer-motion forwards `data-*` through to the
 * DOM, and an animated wrapper is very often the real root of a figure.
 */
import { relative } from 'node:path'

/** Uppercase-initial: React's own rule for "this is a component, not a tag". */
const isComponentName = (name) => typeof name === 'string' && /^[A-Z]/.test(name)

/**
 * The component whose body encloses this element.
 *
 * Walks out through the function nesting. `.map((row) => <tr/>)` inside
 * `DataTable` sits in an arrow function that is NOT a component — it has no name
 * and no uppercase id — so the walk passes straight through it and keeps going
 * until it finds `DataTable`. That is the whole reason this is a loop and not a
 * single `getFunctionParent()`.
 */
function enclosingComponent(path) {
  let fn = path.getFunctionParent()
  while (fn) {
    const node = fn.node
    // function Callout() {}
    if (node.id && isComponentName(node.id.name)) return node.id.name
    // const Callout = () => {} / const Callout = function () {}
    const parent = fn.parentPath?.node
    if (parent?.type === 'VariableDeclarator' && isComponentName(parent.id?.name)) {
      return parent.id.name
    }
    fn = fn.parentPath?.getFunctionParent?.()
  }
  return null
}

export default function markComponents({ types: t }, options = {}) {
  const root = options.root ?? process.cwd()

  return {
    name: 'mark-components',
    visitor: {
      JSXOpeningElement(path, state) {
        const name = path.node.name

        /*
          WHICH ELEMENTS QUALIFY. A plain lowercase tag (`div`, `tr`, `svg`), or a
          member expression on `motion` (`motion.div`). Anything else is a
          component call, and an attribute on it is a prop — see the header.
        */
        let ok = false
        if (t.isJSXIdentifier(name)) {
          ok = /^[a-z]/.test(name.name)
        } else if (t.isJSXMemberExpression(name)) {
          ok = t.isJSXIdentifier(name.object) && name.object.name === 'motion'
        }
        if (!ok) return

        // Never overwrite a marker the source wrote itself.
        const has = (attr) =>
          path.node.attributes.some(
            (a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === attr,
          )
        if (has('data-ui')) return

        const component = enclosingComponent(path)
        if (!component) return

        const line = path.node.loc?.start.line
        const file = state.filename ? relative(root, state.filename) : null

        const add = (attr, value) =>
          path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier(attr), t.stringLiteral(value)))

        add('data-ui', component)
        if (file && line) add('data-ui-loc', `${file}:${line}`)
      },
    },
  }
}
