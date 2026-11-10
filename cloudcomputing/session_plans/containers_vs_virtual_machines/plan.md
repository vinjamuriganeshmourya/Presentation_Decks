# Containers vs Virtual Machines · slide-wise plan

STATUS: signed off on the user's word, 2026-10-28 (the request is the spec: build session 4 from the spec
and TR in `Outputs/cloud_computing/session_plans/session_4/`, every string verbatim, in the format of
sessions 1 to 3, with agenda, quiz and feedback each in BOTH layouts side by side for review).

- **Session:** cloud computing session 4, `Outputs/cloudcomputing/containers_vs_virtual_machines/`, port 5274.
- **Source (content):** `Outputs/cloud_computing/session_plans/session_4/spec.json` (68 cards; `spec.html` is its
  viewer) and `tr.docx` / `tr.json` (the TR). Every kicker, heading, lead, point, table cell, code line, caption
  and analogy sentence is the spec's string, which is the TR's word for word apart from the spec's two
  documented edits: a spaced dash before a short label became a colon, one between clauses a comma (content
  rule 1), and the full stop at the end of a line is dropped (rule 36). Nothing reworded, shortened or added.
- **Screenshots:** the 18 images embedded in `spec.json` (`meta.tr_images`), extracted unchanged to
  `src/decks/figures/cv/shots/`. `as-is` images are shown cropped to the spec's crop; `redraw` images
  (TR slides 1, 6, 12) are redrawn as figures with the corrections the spec lists.
- **Template:** a copy of `virtualization_and_hypervisors` (course rule R2): the cloud player (smooth
  transitions, hidden step/slide switch, presenter and student views, comments, saves into its own file).

## Decisions

1. **Words are the spec's.** The spec's `defects` are carried as written (index.html code and its screenshot
   are on the same card but never side by side; the stray `/` in the KVM row; the unexplained terms).
2. **Motion follows sessions 1 to 3, not the spec's press counts.** These decks auto-animate (course R1): every
   element enters in reading order and every figure runs one self-running loop held still on harness URLs.
   The spec's press list becomes the entrance and loop order (text and the part of the figure it names
   arrive together). Flagged to the user as a conflict with the spec's "one press, one change".
3. **No speaker notes from the TR** (spec build contract). Notes carry only the review-pair instructions.
4. **Agenda, recap and Key Takeaways show the five full lines** (title in bold, the rest after the TR's colon),
   because the user asked for no shortening. This overrides course lesson 4 (titles only) for this deck.
   Section breakers carry the spec's `heading` (the title).
5. **Review pairs (user, 2026-10-28):** agenda0 `AgendaSlide` + agenda1 `AgendaColumns`; quiz0
   `ClassroomQuiz` + quiz1 `QuizCard`; feedback0 kit `FeedbackSlide` + feedback1 `FeedbackCard`. Adjacent,
   the same words where the layout has words (quiz1 reads `Quiz Time!`, the spec's string). The spec has no
   feedback card; both feedback frames are the course's standard ones.
6. **S-WELCOME is the brand frame** `BrandSlide "Welcome!"`: the spec forbids naming the topic on it.
7. **Analogies:** session 2's `IsoAnalogy` with the TR sentence as the lead and no claim pill; the two scene
   labels are the spec's `familiar` and `maps_to`.
8. **Logos** (rule 12, 13): Docker, Podman, containerd, VirtualBox, KVM, Hyper-V, VMware, AWS, Azure, Google
   Cloud, Windows, macOS, Ubuntu, Linux, EC2. Podman, containerd and Ubuntu fetched into
   `slide-kit/assets/tech/` first (official artwork).

## Slides

| # | id | Spec | Frame |
|---|---|---|---|
| 1 | S-WELCOME | S-WELCOME | BrandSlide "Welcome!" |
| 2 | S-RECAP | S-RECAP | Takeaways (presenter art), kicker Recap, title Virtualization & Hypervisors, five lines |
| 3 | S-AGENDA | S-AGENDA | agenda0: AgendaSlide, five items |
| 4 | S-AGENDA-1 | S-AGENDA | agenda1: AgendaColumns, the same five items |
| 5 | D1 | D1 | Breaker: Container Fundamentals |
| 6-10 | T01-1 … T03-2 | | section file `cv/fundamentals.tsx` |
| 11 | D2 | D2 | Breaker: Docker Architecture |
| 12-21 | T04-1, T05-1, T05-S1 … S8 | | `cv/install.tsx` |
| 22-31 | T06-1 … T10-AN | | `cv/docker.tsx` |
| 32-39 | T11-1 … T11-8 | | `cv/build.tsx` |
| 40 | D3 | D3 | Breaker: Containers vs VMs |
| 41-47 | T12-1 … T16-1 | | `cv/compare.tsx` |
| 48 | D4 | D4 | Breaker: Choosing Between Them |
| 49-53 | T17-1 … T20-2 | | `cv/choose.tsx` |
| 54 | D5 | D5 | Breaker: Tooling & Registries |
| 55-64 | T21-1 … T26-1, X1 | | `cv/tooling.tsx` |
| 65 | S-QUIZ | S-QUIZ | quiz0: ClassroomQuiz |
| 66 | S-QUIZ-1 | S-QUIZ | quiz1: QuizCard "Quiz Time!" |
| 67 | S-TAKEAWAYS | S-TAKEAWAYS | Takeaways, five lines |
| 68 | S-NEXT | S-NEXT | NextSessionSlide "Cloud Networking & VPC" |
| 69 | feedback | (standard) | feedback0: FeedbackSlide |
| 70 | feedback-card | (standard) | feedback1: FeedbackCard |
| 71 | S-THANKS | S-THANKS | ThankYouSlide "Thank You" |
| 72 | S-BEST | S-BEST | ThankYouSlide "All the Best" |

Per-card frames inside each section file follow the spec card's `kit`, `visual`, `visual_guidance` and `must`.
