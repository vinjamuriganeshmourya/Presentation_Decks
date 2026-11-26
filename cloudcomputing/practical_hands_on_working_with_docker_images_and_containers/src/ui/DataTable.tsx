import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useInstant } from "@/motion/instant";
import { accentByTone, colors, type Tone } from "@/design/tokens";

/**
 * Comparison table.
 *
 * The Evolve kit has no table: `BulletList`, `CardGrid` and `AnalogyMap` all
 * break a row into independent tiles, which is exactly wrong for the slides
 * that teach *by* the column alignment — "Problem 1 vs Problem 2",
 * "VM vs Container", "requirement vs how it's met". Those need the eye to run
 * down a column.
 *
 * Built from the same vocabulary as the rest of the kit (`rounded-card`,
 * `border-line`, `shadow-card-soft`, `accentByTone`) so it reads as native.
 *
 * ENTRANCE
 * The table assembles itself on arrival, with no click anywhere in it: the
 * header labels come in first, left to right, and only once the header has
 * landed do the data rows drop in one after another, top to bottom. That is the
 * order the table is read in, so the motion teaches the reading path instead of
 * fighting it — you see WHAT the columns are before you are given anything to
 * put in them.
 *
 * It is deliberately not a click-driven build. A table is a single exhibit that
 * happens to have parts; making the presenter click through five rows turns one
 * idea into five beats. The whole thing is on screen inside two seconds.
 */

/** Beat map for the entrance, in seconds. */
const HEAD_START = 0.15;
const HEAD_STEP = 0.07;
const ROW_STEP = 0.13;
const EASE = [0.22, 1, 0.36, 1] as const;

export interface TableColumn {
  label: ReactNode;
  /** Relative width. Defaults to 1. */
  weight?: number;
  align?: "left" | "center";
  /** Renders the whole column at reduced opacity — the "parked / later" column. */
  dim?: boolean;
}

export type TableRow = ReactNode[];

export function DataTable({
  columns,
  rows,
  tone = "brand",
  /** 1-based row numbers to emphasize. */
  highlight = [],
  compact = false,
  className = "",
}: {
  columns: TableColumn[];
  rows: TableRow[];
  tone?: Tone;
  highlight?: number[];
  compact?: boolean;
  className?: string;
}) {
  /* On an instant jump (Ctrl+arrow) the rest of the slide snaps to its final
     state, so the table must too: a lone cascading table would be the only thing
     moving on an otherwise still slide. */
  const instant = useInstant()
  const color = accentByTone[tone];
  const hl = new Set(highlight);
  const grid = columns.map((c) => `${c.weight ?? 1}fr`).join(" ");
  const pad = compact ? "px-5 py-2.5" : "px-5 py-3.5";
  /** When the last header label has settled, and the rows may start. */
  const headerEnd = HEAD_START + (columns.length - 1) * HEAD_STEP + 0.35;

  return (
    /*
      A LIT SURFACE, NOT A WHITE RECTANGLE (STYLE_GUIDE section 9).

      `bg-white shadow-card-soft` gave the table a neutral, almost invisible
      drop and one flat fill, so on a slide beside a `Callout` or a `Terminal`
      it read as the flattest thing on the frame — a region the content sat in
      rather than a panel sitting on the slide. It now carries the deck's
      standard treatment: a top-left highlight, a ramp that lands just off
      white, a shadow tinted with the table's OWN tone rather than with neutral
      black, and a white hairline along the top edge.

      The tinted shadow is what lets two tables of different tones on
      neighbouring slides read as different objects rather than as the same
      object repainted.
    */
    <div
      className={`overflow-hidden rounded-card border border-line ${className}`}
      style={{
        background:
          'radial-gradient(120% 90% at 10% 0%, #FFFFFF 0%, #FFFFFF 52%, #F6F9FE 100%)',
        boxShadow: [
          `0 10px 28px -16px ${color}66`,
          `0 2px 6px -4px ${colors.brandDeep}1f`,
          'inset 0 1px 0 0 #FFFFFF',
        ].join(', '),
      }}
    >
      {/* Header — labels arrive first, left to right.
          Its tint gets the same ramp, so the header reads as the raised lip of
          the panel rather than as a coloured stripe painted onto it. */}
      <div
        className="grid items-end gap-x-2"
        style={{
          gridTemplateColumns: grid,
          background: [
            'radial-gradient(120% 140% at 12% 0%, #FFFFFFb3 0%, #FFFFFF00 64%)',
            `linear-gradient(135deg, ${color}0a 0%, ${color}14 100%)`,
          ].join(', '),
          boxShadow: `inset 0 -1px 0 0 ${color}29`,
        }}
      >
        {columns.map((c, i) => (
          <motion.div
            key={i}
            initial={instant ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: c.dim ? 0.5 : 1, y: 0 }}
            transition={{
              delay: HEAD_START + i * HEAD_STEP,
              duration: 0.45,
              ease: EASE,
            }}
            className={`${pad} font-heading text-body-sm font-bold uppercase tracking-wider ${
              c.align === "center" ? "text-center" : ""
            }`}
            style={{ color }}
          >
            {c.label}
          </motion.div>
        ))}
      </div>

      {/*
        Rows are timed off the header rather than staggered by a parent group:
        the delay is computed per row, so the cascade always starts after the
        last header label has landed no matter how many columns there are, and it
        never waits on a click or on a parent's reveal state.
      */}
      <div className="block">
        {rows.map((row, r) => (
          <motion.div
            key={r}
            className="grid items-center gap-x-2 border-t border-line"
            style={{
              gridTemplateColumns: grid,
              /* A highlighted row is the one thing on the table the slide is
                 pointing at, so it gets lit rather than merely tinted: the same
                 ramp plus a hairline on its own top edge, which is what lifts it
                 off the rows around it instead of staining it. */
              background: hl.has(r + 1)
                ? [
                    'radial-gradient(100% 200% at 6% 0%, #FFFFFFcc 0%, #FFFFFF00 70%)',
                    `linear-gradient(135deg, ${color}0f 0%, ${color}1f 100%)`,
                  ].join(', ')
                : r % 2
                  ? "#FBFDFF"
                  : undefined,
              boxShadow: hl.has(r + 1)
                ? `inset 0 1px 0 0 #FFFFFF, inset 3px 0 0 0 ${color}`
                : undefined,
            }}
            initial={instant ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: headerEnd + r * ROW_STEP,
              duration: 0.5,
              ease: EASE,
            }}
          >
            {row.map((cell, c) => {
              const col = columns[c];
              return (
                <div
                  key={c}
                  className={`${pad} text-body-sm leading-snug ${
                    col?.align === "center" ? "text-center" : ""
                  } ${c === 0 ? "font-semibold text-ink" : "text-body"}`}
                  style={col?.dim ? { opacity: 0.45 } : undefined}
                >
                  {cell}
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
