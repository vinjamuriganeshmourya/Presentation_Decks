# Cloud Networking & VPC · slide-wise plan

STATUS: signed off on the user's word, 2026-10-29 (the request is the spec: build session 5 the way session 4
was built, from the spec and TR in `Outputs/cloud_computing/session_plans/session_5/`, every string verbatim,
the TR's order unchanged, every analogy drawn exactly as the TR describes it).

- **Session:** cloud computing session 5, `Outputs/cloudcomputing/cloud_networking_and_vpc/`, port 5275.
- **Source (content):** `Outputs/cloud_computing/session_plans/session_5/spec.json` (60 cards; `spec.html` is its
  viewer) and `tr.docx` / `tr.json` (the TR). Every kicker, heading, lead, point, table cell, caption and analogy
  clause is the spec's string, which is the TR's word for word apart from the spec's documented edits (a spaced
  dash before a label became a colon, one between clauses a comma, the full stop at a line's end dropped, `Vpc`
  written `VPC`, three typos fixed, one run-together sentence split). Nothing reworded, shortened, reordered or
  added. The TR's slide order is the deck's order: the spec's `tr_coverage` list, top to bottom.
- **Screenshots:** the six lab captures embedded in `spec.json` (`meta.tr_images`, `use: as-is`), extracted
  unchanged to `src/decks/figures/net/shots/`, served from a 2x sharpened copy (`shots-hd/`, course rule R4),
  cropped in source pixels to the spec's crop, highlights in the template orange. Account and owner ids stay out
  of every crop. The four `redraw` images (TR slides 7, 15, 20, 21) are drawn again in template colours with the
  corrections the spec lists; the TR slide 1 image is not used (the spec: a stock diagram, content rule 8).
- **Template:** a copy of `containers_vs_virtual_machines` (course rule R2): the cloud player (smooth
  transitions, hidden step/slide switch, presenter and student views, comments, saves into its own file).

## Decisions

1. **Words are the spec's.** The spec's `defects` are carried as written (leads over 20 words, terms used before
   their introduction, the 42-word VPN line on its own card T17-2, the four-row table the guidance calls three).
2. **Motion follows the course, not the spec's press counts.** The deck auto-animates (course R1): every element
   enters in reading order and every figure runs one self-running loop held still on harness URLs. The spec's
   press list is the entrance and loop order (text and the part of the figure it names arrive together). Flagged
   as a conflict with the spec's "one press, one change", as on session 4.
3. **No speaker notes from the TR** (spec build contract).
4. **Recap, agenda, breakers and Key Takeaways carry the five titles only** (course rule R5, lesson 4): the words
   before the TR's colon. The sub lines stay in the source.
5. **Analogies (course rule R3, and the user's "analogies represented exactly"):** each analogy card is the
   kicker, the title and two pictures, the familiar scene on the left and the concept scene on the right, the
   matched parts lined up. No sentence, no caption pill, no SAME IDEA words. Every clause of the TR's analogy is
   a tag inside the picture it describes, in the TR's own words (course lesson 2), so the picture IS the TR's
   analogy: a school's gates, corridors and entry rules; a gated society inside one campus; a postal sorting hub
   reading only the pincode; a ticket counter at a venue; a private telephone line between two offices; a
   two-way access door and a campus checkpoint.
6. **One VPC drawing runs through the deck** (spec design note 1): `figures/net/frames.tsx` draws the dashed
   boundary, the public and private subnet boxes, the gateways on the edge, a route table beside each subnet
   and a lock on each subnet, once; the section files light the part their card is about.
7. **The practical's divider (D-LAB)** is a breaker frame with the kicker `Practical Hands-On` and the title
   `Building a Cloud Network with AWS VPC`, rendered through a session wrapper so the section bar keeps one
   segment per agenda point (the lab belongs to section 5, where the TR puts it). No logo on a divider (course
   lesson 4: breakers carry the title only).
8. **Standard closing frames:** the kit agenda, `ClassroomQuiz`, the Takeaways frame, `NextSessionSlide`, the
   kit `FeedbackSlide` (the spec has no feedback card; the course's standard one is added, content rule 41),
   Thank You, All the Best. Session 4's second layouts (`variants.tsx`) are in the copy and can be added beside
   any of them on request.
9. **S-WELCOME is the brand frame** `BrandSlide "Welcome!"`: the spec forbids naming the topic on it.
10. **Logos** (rules 12, 13): AWS on T02-1, T04-1, T05-1, T06-1 and T24-1; Azure and Google Cloud on T05-1 and
    T06-1; all from `slide-kit/assets` (already in the copy's `figures/cv/marks/`, copied to `net/marks/`).
11. **Monospace** (spec design note 3): every CIDR, address, zone name and resource name is set in `Mono`,
    in a point as much as in a table cell.
12. **Nothing the TR does not give goes into a figure:** no invented rule number, port, address or price; a rule
    list the TR gives no values for is drawn as a shape with its column heads only (T21-1).
13. **Section 4 (`net/routing.tsx`), built 2026-10-30** after the 2026-10-29 session ended with it as a stub. The
    route entries on T16-1 and T17-1 are chip stacks (destination, an arrow, the target) rather than a full
    table, as the spec's play for T17-1 allows and because `nat-gateway-id` does not fit a table beside the
    drawing; T14-1 and T15-1 draw the real two-row table. T17-2 carries the AWS mark beside `AWS side` on the
    VPC box because the point names AWS (content rule 12). On T16-1 the subnet names sit at the foot of each
    box so the NAT gateway's lines run clear of them.

## Slides

| # | id | Spec | Frame |
|---|---|---|---|
| 1 | S-WELCOME | S-WELCOME | BrandSlide "Welcome!" |
| 2 | S-RECAP | S-RECAP | Takeaways (presenter art), kicker Recap, title Containers vs Virtual Machines, five titles |
| 3 | S-AGENDA | S-AGENDA | AgendaSlide, five titles |
| 4 | D1 | D1 | Breaker 01: Cloud Networking Overview |
| 5-9 | T01-1, T01-AN, T02-1, T02-2, T02-3 | | section file `net/overview.tsx` |
| 10 | D2 | D2 | Breaker 02: Virtual Private Cloud (VPC) |
| 11-16 | T03-1, T03-2, T03-AN, T04-1, T05-1, T06-1 | | `net/vpc.tsx` |
| 17 | D3 | D3 | Breaker 03: Subnets & IP Addressing |
| 18-23 | T07-1, T08-1, T09-1, T09-2, T10-1, T11-1 | | `net/subnets.tsx` |
| 24 | D4 | D4 | Breaker 04: Routing & Gateways |
| 25-35 | T13-1, T14-1, T14-AN, T15-1, T16-1, T16-AN, T17-1, T17-2, T17-AN, T18-1, T18-2 | | `net/routing.tsx` |
| 36 | D5 | D5 | Breaker 05: Network Security Controls |
| 37-44 | T19-1, T19-AN, T20-1, T20-2, T21-1, T21-2, T22-1, T23-1 | | `net/security.tsx` |
| 45 | D-LAB | D-LAB | Breaker: Practical Hands-On, Building a Cloud Network with AWS VPC |
| 46-55 | T24-1, T24-2, T25-1, T26-1, T26-2, T27-1, T28-1, T28-2, T28-3, T29-1 | | `net/lab.tsx` |
| 56 | S-QUIZ | S-QUIZ | ClassroomQuiz "Quiz Time!" |
| 57 | S-TAKEAWAYS | S-TAKEAWAYS | Takeaways, five titles |
| 58 | S-NEXT | S-NEXT | NextSessionSlide "Load Balancing & CDN" |
| 59 | feedback | (standard) | FeedbackSlide |
| 60 | S-THANKS | S-THANKS | ThankYouSlide "Thank You" |
| 61 | S-BEST | S-BEST | ThankYouSlide "All the Best" |

Per-card frames inside each section file follow the spec card's `kit`, `visual`, `visual_guidance`, `must` and
`must_not`, and the card's presses are the entrance and loop order.
