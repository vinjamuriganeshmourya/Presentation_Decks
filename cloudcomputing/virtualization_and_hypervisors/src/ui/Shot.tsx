/**
 * A real screen capture, framed for a slide.
 *
 * Hard rule 11: a raw capture is evidence, not a slide asset. Crop before it
 * gets here, keep the context that carries meaning (a terminal keeps its
 * `PS <path>>` prompt, a browser keeps its address bar), and never retouch the
 * pixels: if a capture is wrong, re-run the command and capture again.
 *
 * The `highlight` prop is deliberately optional and deliberately singular.
 * Cropping is mandatory, boxing is not. A deck where every capture wears a box
 * teaches the learner to ignore boxes, so add one only when the crop alone does
 * not put the claim under the eye, and only ever one per capture.
 */

import type { ReactNode } from 'react'

export interface ShotHighlight {
  /** Box position as a percentage of the image, so it survives any render size. */
  left: number
  top: number
  width: number
  height: number
  /** Optional label placed just below the box. */
  label?: ReactNode
}

/**
 * BROWSER CHROME, DRAWN BY THE DECK AND NOT PART OF THE CAPTURE.
 *
 * This file's own header already asks a browser capture to "keep the context
 * that carries meaning: a browser keeps its address bar". A headless capture
 * cannot, because the browser's own furniture is not in the page, and cropping
 * a real window in from a desktop screenshot drags in the operating system, the
 * tab bar and whatever else was open.
 *
 * So the frame is drawn and the capture goes inside it. Asked for on
 * 2026-09-09: *"while inserting the screenshot in a browser component to show
 * the url"*, and then *"we can use a UI browser component and add externally,
 * not required inside the screenshot"*.
 *
 * TWO HONESTY RULES, because a drawn frame is a claim like any other:
 *
 *   - `url` MUST be the address the capture was actually taken from. The frame
 *     exists to tell a learner where they will be when they see this, and a URL
 *     that does not match the picture is a content error (rule 8), not a
 *     decoration.
 *   - The chrome carries NO BRAND. No vendor logo, no vendor-specific button
 *     shapes, no window controls that imply an operating system. It says "this
 *     is in a browser, at this address" and nothing more, because the room is on
 *     Windows, Mac and Linux and the deck must not claim one.
 *
 * The pixels of the capture are still never retouched. The frame is outside them.
 */
export interface ShotChrome {
  /** The real address the capture came from. Shown in the bar, verbatim. */
  url: string
}

export function Shot({
  src,
  alt,
  caption,
  highlight,
  chrome,
  className = '',
}: {
  src: string
  alt: string
  /** What the learner is looking at. Not a repeat of the slide title. */
  caption?: ReactNode
  highlight?: ShotHighlight
  /** Draws a plain browser frame around the capture, showing the URL. */
  chrome?: ShotChrome
  className?: string
}) {
  return (
    <figure className={`m-0 ${className}`}>
      <div className="relative overflow-hidden rounded-card shadow-card ring-1 ring-black/10">
        {chrome && (
          <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3 py-2">
            {/* Three dots, the one piece of window furniture every browser has
                and no browser owns. Neutral greys, never the traffic-light
                colours, which belong to one operating system. */}
            <span className="flex shrink-0 gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-pill border border-line bg-white px-3 py-1 font-mono text-[13px] leading-none text-body">
              {chrome.url}
            </span>
          </div>
        )}
        {/* THE IMAGE AND ITS HIGHLIGHT SHARE THEIR OWN POSITIONING CONTEXT.

            `ShotHighlight` is expressed in PERCENT of the image, which is what
            makes a measured box survive any render size. The browser chrome
            above is a sibling, so if the highlight resolved against the outer
            box instead, adding chrome would move every existing box down by the
            bar's height and nothing would fail: the deck would just be pointing
            slightly below the thing it means. This wrapper is what keeps a
            percentage meaning what it says. */}
        <div className="relative">
          <img src={src} alt={alt} draggable={false} className="block h-auto w-full select-none" />

          {highlight && (
            <>
              {/* The box. Amber reads as "look here" on both light and dark captures
                  and does not collide with the deck's blue or with terminal green. */}
              <span
                aria-hidden
                className="pointer-events-none absolute rounded-[4px]"
                style={{
                  left: `${highlight.left}%`,
                  top: `${highlight.top}%`,
                  width: `${highlight.width}%`,
                  height: `${highlight.height}%`,
                  border: '3px solid #F59E0B',
                  boxShadow: '0 0 0 3px rgba(245,158,11,0.28)',
                }}
              />
              {highlight.label && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute whitespace-nowrap rounded-full px-3 py-1 font-mono"
                  style={{
                    left: `${highlight.left}%`,
                    top: `calc(${highlight.top + highlight.height}% + 8px)`,
                    fontSize: 13,
                    color: '#7C3E00',
                    background: '#FDE68A',
                  }}
                >
                  {highlight.label}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {caption && (
        <figcaption className="mt-2 text-center text-[13px] leading-snug text-ink-soft">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
