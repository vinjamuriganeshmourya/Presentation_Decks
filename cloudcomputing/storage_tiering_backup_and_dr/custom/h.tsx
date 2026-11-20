/**
 * 2026-11-10 review round (seventh change list): opening-frame line breaks and the feedback frame.
 * The kit's title and agenda frames take the session name and agenda from deck meta as plain strings, which
 * also feed the footer, breakers and takeaways, so the breaks are set here rather than in meta.
 */
import type { ReactNode } from 'react'
import { AgendaColumns, FeedbackCard } from '@/decks/figures/variants'

type P = { lesson: string; agenda?: string[] }

/** Slide 2 stays the kit title frame (deck rule R9); its session name is narrowed so "Backup & DR" starts line two. */
export const css = `h1.max-w-4xl.font-tpl-title { max-width: 640px; }`

/** Slide 4: the kit agenda, its fourth item set on two lines. */
function S_Agenda({ lesson, agenda = [] }: P) {
  const items = agenda.map((t, i) =>
    i === 3
      ? {
          title: (
            <>
              {t.split(' ')[0]}
              <br />
              {t.split(' ').slice(1).join(' ')}
            </>
          ) as unknown as string,
        }
      : { title: t },
  )
  return <AgendaColumns kicker={lesson} lesson={lesson} items={items} />
}

/** After the quiz: Feedback Version1 (the kit's feedback1 frame: rating bubble with three faces over "Feedback"). */
function S_Feedback({ lesson }: P) {
  return <FeedbackCard lesson={lesson} />
}

export const slides: Record<string, (p: Record<string, unknown>) => ReactNode> = {
  S_Agenda: S_Agenda as (p: Record<string, unknown>) => ReactNode,
  S_Feedback: S_Feedback as (p: Record<string, unknown>) => ReactNode,
}
