<!-- cSpell:ignore NxtWave devPort Meera Ravi Anita CharLab hypervisor CloudWatch DynamoDB GDPR -->
# Cloud Computing · "Cloud Computing Fundamentals"

**STATUS: SIGNED OFF 2026-10-14** (user: *"yes but plan and execute don't wait
for the signedoff from me just do it"*). The reference deck is the signed-off
content; this plan maps every word of it onto the updated base template and the
design-improvement plan given in the same conversation, and the deck is
generated from it in the same run.

| | |
|---|---|
| `SESSION_NAME` | `Cloud Computing Fundamentals` |
| `COURSE` | `cloudcomputing` (a new course folder, `Outputs/cloudcomputing/`) |
| Source | `Reference ppt's/cloud-computing-fundamentals 1.html`, a built deck of 60 frames. Content only: its layouts, palette and template are not reused |
| Project | `Outputs/cloudcomputing/cloud_computing_fundamentals/` (copied from `slide-kit/slide-template` on branch `kit/new-template-design`, the updated base template) |
| Deck file | `src/decks/cloudDeck.tsx` |
| Slide count | **53** (60 reference frames; eight "continued" pairs merged into one stepped slide each, Thank You and All the Best split into two frames per content rule 41) |
| `devPort` | `5270` |
| `htmlName` | `cloud-computing-fundamentals` |

## The one idea

Cloud computing is computing rented as a metered service: someone else owns the
machines, you take what you need over the network, when you need it, and pay
for what you use. Every characteristic, every era before it and every trade-off
after it is a picture of that one sentence.

## Decisions

1. **Every word of the reference is kept.** Titles, kickers, leads, bullets,
   table cells, chip labels, figure labels, captions and analogy claims are the
   reference's own strings. Only punctuation moves where a hard rule requires
   it: a line never ends in a full stop (rule 36), two sentences on one line
   become two lines, and the reference's `—` in speaker notes stays in notes
   only. The reference's speaker notes ("TR speaker notes") are the deck's
   `notes`. Figure-construction notes about the old build are dropped from the
   notes, because they describe a layout this deck no longer has.
2. **Merged pairs, one stepped slide each:** mainframes (reference 14 and 15),
   virtualization (17, 18), grid and utility (20, 21), five NIST traits (27,
   28), elasticity against scalability (38, 39), the trade-offs map (43, 44),
   CapEx to OpEx (45, 46), the benefit and risk pairing (54, 55). The second
   frame's bullets and table arrive as later beats of the first, so nothing is
   dropped and the room sees one heading with one growing exhibit.
3. **One cast, one stage.** Every person is a character-lab character
   (generate-slides 2b item 12, `figures/cast/` vendored unchanged from Python
   31, configs in `figures/people.tsx`): **Meera**, a founder who needs
   servers; **Ravi**, the on-premise admin beside his racks; **Arjun** (the
   lab's preset), the provider's engineer; **Anita**, finance, who reads the
   bill; an **operator** for the mainframe era; tenant faces cut with the lab's
   `FACE` crop. Left of the stage is Ravi's locked server room, right is the
   provider's building, the line between them is the internet.
4. **Analogies are drawn scenes, not photographs.** The reference's five photos
   (ATM, mess kitchen, rubber band, taxi, cupboards) and its icon strips are
   replaced by drawn scenes in the lab's flat style. Each analogy is one
   `AnalogyScene`: beat 1 the everyday scene, beat 2 `SAME IDEA` and the cloud
   scene with each object turned into its cloud counterpart, beat 3 the claim.
   The labels are the reference's own.
5. **Interactions** (the brief asks for as much as possible): every figure
   slide is stepped with Next and the icon-only Autoplay (generate-slides 2).
   On top of the steps, five live controls the room can use: the demand slider
   (why cloud emerged, rapid elasticity), the Launch Instance button
   (self-service), the meter switches (measured service, electricity meter),
   the region buttons (latency), the device buttons (network access). A
   control never changes slide; the kit's gesture hook ignores a swipe that
   starts on one. **No drag-to-move content** (the archived feature stays
   archived): where the improvement plan said "drag", the deck uses a slider or
   a click, which needs no new rule and reads from the back of a room.
6. **Logos** (content rule 12): AWS on the network-access, region and cost
   slides; Amazon, Google and Microsoft marks on the 2006 milestones, from
   `slide-kit/assets/` (rule 13).
7. **The real capture** of the AWS Global Infrastructure page (reference 48) is
   kept as a real screenshot under `public/shots/`, extracted byte for byte
   from the reference file.
8. **Agenda** keeps the reference's five items (rule 20's "at most four" is
   broken by the TR's own agenda, which the user asked to keep word for word).
   `AgendaSlide kicker={SESSION} title="Agenda"`, static (rules 39, 44).
   Key Takeaways repeats the five strings verbatim.
9. **Quiz frames:** two, as the reference: after History and Evolution, and
   immediately before Key Takeaways (rule 18). The kit's `ClassroomQuiz`, which
   carries the reference's own three steps.
10. **Close:** Next Session (`Deployment & Service Models`), the kit's
    `FeedbackSlide`, Thank You, All the Best (rule 41).
11. **Autoplay** opens on the analogy scenes and the dividers' neighbours only;
    every slide with a live control opens step-wise so the room can use it.

## Frameworks (PEDAGOGY_GUIDELINES section 2)

| Concept | Framework | Need slide | Proof slide |
|---|---|---|---|
| Cloud Computing Basics | SCQA | Why Cloud Emerged (Ravi's rack bought on a guess) | Cost Scale Speed |
| History & Evolution | STAR | Four Eras (each era's resource problem) | Eras And Their Legacy |
| Essential Characteristics - I | Merrill | Five NIST Traits | Shared Infrastructure Model + mess kitchen |
| Essential Characteristics - II | Merrill | Elasticity Scalability Metering | Pay-Per-Use Metering + electricity meter |
| Benefits & Challenges | 4MAT | Cloud Trade-Offs Map | Weighing Trade-Offs Together |

Term ledger: on-premise, cloud (5) · NIST, service models, deployment models (6)
· CapEx, OpEx (9) · front end, back end (10) · mainframe, batch, time-sharing
(14) · client-server, hypervisor, virtual machine (16) · grid, utility (18) ·
the five traits (24) · multi-tenancy (28) · elasticity, scalability, Auto
Scaling Group, CloudWatch (31, 32) · metering (35) · lock-in, egress (42) ·
latency, data residency, Region (46). No term is used above its row.

## Slides

| # | id | Type / figure | Beats | What appears, what moves, what the room does |
|---|---|---|---|---|
| 1 | brand | `BrandSlide` "Welcome!" | 0 | |
| 2 | welcome | `WelcomeSlide minimal` | 0 | |
| 3 | agenda | `AgendaSlide`, five items | 0 | static |
| 4 | s1 | `SectionBreakerSlide` 1 | 0 | |
| 5 | why-emerged | `WhyCloud` | 4 | Ravi beside the rack he bought; a demand slider. Low demand dims idle servers (`paid, idle`); high demand overflows the rack. Toggle to Meera's side: servers follow the slider, the meter ticks only for live ones. Panels: On-premise IT, Cloud IT; caption last |
| 6 | nist | `NistReader` | 5 | four bullets arrive one per beat beside the NIST definition; each beat highlights its phrase in the definition and lights a stage part |
| 7 | nist-branches | `NistTree` | 4 | the hub, then three branches grow, each with its leaves |
| 8 | nist-analogy | `AnalogyScene` apartment | 3 | Meera walks in with one bag; bed, sofa, fridge, lamp become compute, storage, network |
| 9 | onprem-vs-cloud | `OwnershipSplit` | 6 | five rows, each animated on the split stage (key, coins vs meter, calendar vs stopwatch, hauling a rack vs servers appearing, toolkit vs provider) while the table row fills |
| 10 | architecture | `ArchitectureWalk` | 5 | a request dot travels client, internet, the five back-end layers; management and security run down both sides |
| 11 | drivers | `Drivers` | 4 | three before-and-after tiles: cost, scale, speed; then the Cloud Adoption bar and the caption |
| 12 | s2 | divider 2 | 0 | |
| 13 | four-eras | `EraWalk` | 4 | four era scenes on a timeline, one spotlit per beat |
| 14 | mainframes | `Mainframe` (14 + 15) | 5 | operator and cabinet; batch tray; four terminals lit in turn by a sweeping clock; "my computer" illusion; CP-40/CP-67 |
| 15 | mainframes-analogy | `AnalogyScene` reading room | 3 | one book passes reader to reader |
| 16 | virtualization | `Hypervisor` (17 + 18) | 5 | desktop to server; the hypervisor slides in and splits the server into three VMs with their own OS and locks |
| 17 | virtualization-analogy | `AnalogyScene` plot | 3 | building cutaway, three locked flats |
| 18 | grid-utility | `GridMeter` (20 + 21) | 5 | institutions' idle CPUs take pieces of one job; the meter counts only while pieces run |
| 19 | grid-analogy | `AnalogyScene` trucks | 3 | three senders' parcels on one truck, each weighed |
| 20 | public-cloud | `Milestones` | 4 | storefronts open year by year with the marks; the adoption curve draws |
| 21 | evolution-table | `EraTable` | 4 | each era's legacy chip flies into the cloud and its row fills |
| 22 | quiz-mid | `ClassroomQuiz` | 0 | |
| 23 | s3 | divider 3 | 0 | |
| 24 | five-traits | `TraitRing` (27 + 28) | 6 | five hotspots round the cloud; each beat lights one, plays its micro-scene, adds its gloss |
| 25 | self-service | `SelfService` | 4 | Ravi's ticket crosses three desks for weeks; Meera presses Launch Instance (live button); console, CLI, API tabs |
| 26 | self-service-analogy | `AnalogyScene` ATM | 3 | card in, cash out, nobody to ask |
| 27 | network-access | `DeviceRing` | 3 | four devices round the AWS API; click a device and its request runs the spoke |
| 28 | pooling | `TenantRack` | 5 | tenants assigned to slices; the hypervisor; a toggle hides where they run |
| 29 | pooling-analogy | `AnalogyScene` mess kitchen | 3 | one cook serves from shared trays |
| 30 | s4 | divider 4 | 0 | |
| 31 | three-overview | `ControlBoard` | 4 | demand dial, capacity gauge, meter, one per beat |
| 32 | elasticity | `ElasticChart` | 5 | live chart, demand slider; the alarm line adds and removes instance tiles; cost strip fills only while they run |
| 33 | elasticity-analogy | `AnalogyScene` rubber band | 3 | the band stretches and springs back |
| 34 | elasticity-scalability | `TwoLanes` (38 + 39) | 6 | the same spike in two lanes, then the four table rows |
| 35 | measured-service | `MeterBank` | 5 | four dials with switches; the bill grows only for live ones; all off reads zero |
| 36 | measured-analogy | `AnalogyScene` electricity meter | 3 | switches on a fan, lamp, fridge turn the wheel |
| 37 | s5 | divider 5 | 0 | |
| 38 | tradeoffs | `TradeoffScale` (43 + 44) | 5 | each benefit drops on the scale with its challenge; the table fills |
| 39 | capex-opex | `CapexOpex` (45 + 46) | 5 | four-year timeline: CapEx coin tower in year one, OpEx monthly trickle; Reserved Instances toggle |
| 40 | capex-analogy | `AnalogyScene` taxi | 3 | Meera's taxi meter ticks per trip; a parked car costs every day |
| 41 | growth-speed | `GrowthSpeed` | 5 | elasticity curve, the real Region capture, idea to production in days |
| 42 | lock-in | `LockIn` | 5 | the app built from one provider's blocks; the move snags; egress fee; mitigation swaps the blocks |
| 43 | lock-in-analogy | `AnalogyScene` cupboards | 3 | fitted cupboards stay when the tenant leaves |
| 44 | cost-overruns | `Overruns` | 5 | a forgotten server keeps the bill climbing; the budget alarm flags it |
| 45 | overruns-analogy | `AnalogyScene` roaming | 3 | roaming left on, the bill grows overnight |
| 46 | latency-residency | `RegionMap` | 4 | click the near or distant Region and the packet runs with its delay; the residency fence |
| 47 | benefit-risk | `PairScales` (54 + 55) | 4 | three level scales, then the table |
| 48 | quiz-close | `ClassroomQuiz` | 0 | |
| 49 | takeaways | `Takeaways` (`figures/closing.tsx`), the agenda's five items | 0 | five cards, each beside its section's picture; the kit's slide ran the fifth item under the player bar |
| 50 | next-session | `NextSessionSlide` | 0 | |
| 51 | feedback | `FeedbackSlide` | 0 | |
| 52 | thank-you | `ThankYouSlide` | 0 | |
| 53 | all-the-best | `ThankYouSlide title="All the Best"` | 0 | |

## Carry-forward standard (generate-slides 2b)

Items 1 to 3 (`Group`, `Group active`, `Focus`), 5 (centred captions), 9 to 11
(ease-ins, purposeful motion, `usePhase`-style movement inside a press), 12
(lab characters), 14 (no overflow) and 15 (no drag) apply on every figure
slide. Items 4, 6, 7, 8 and 13 (code panes, vote options, code sizes, task
pills, phones) have nothing to apply to: the deck has no code and no vote.

## Gate

typecheck, build:html, qa, video-safe, align-check, mixed-align-check,
overlap-check, controls-clear-check, box-overflow-check, feedback-check,
gesture-check, agenda-check, ligature-check, autoplay-check, then the
screenshots read by eye at step 0, mid-run and fully revealed.

## Changes made during the build (2026-10-14)

- **Agenda kicker and title.** The reference's `Agenda for Today's Session` /
  `What We Will Cover` are replaced by the session name over `Agenda`, as
  content rule 39 requires. These are the only on-slide words of the
  reference not on the new deck.
- **Key Takeaways** is a session component: five long items do not fit the
  kit's `KeyTakeawaysSlide`.
- **Type floor.** Every label, note, control and badge renders at 14px or
  more; qa's 16px warning remains on figure labels.
- **Autoplay list** set by slide id in the deck file (kit list held Python
  31's numbers).

---

## Revision 2026-10-15 (review feedback, applied on the user's word)

- Slide 6 definition replaced with the review's NIST wording; definition and the
  four points are now two slides. Slides 18, 21, 24, 38, 39, 41, 42, 44, 46 split
  the same way (statement, then points and picture); 34 splits chart / table;
  21's table moves to its own slide and the "what cloud inherited" panel goes.
- Slide 11 (Cost, Scale and Speed) and 16 (Hardware Gets Abstracted): copy
  replaced word for word by the review's.
- Slide 47: balances removed (duplicated the table); slide 38's balance lost
  its pair labels for the same reason.
- 53 → 64 slides.
- Deck-wide: no step builds, no Next or Autoplay; every element enters in
  reading order within 1.5s; every slide change is the one smooth transition;
  the slide picker shows live thumbnails. Details in the session CLAUDE.md.

## 2026-10-30 addendum: review pairs for Agenda and Quiz

Added beside the existing frames, on the user's word, in the shared file and in
the deck source (71 slides). The user picks one of each pair later and deletes
the other.

| after | id | content |
|---|---|---|
| 3 `agenda` (agenda0, `AgendaSlide`) | `agenda-columns` | agenda1: `AgendaColumns`, the same five titles, no sub lines |
| 27 `quiz-mid` (quiz0, `ClassroomQuiz`) | `quiz-mid-card` | quiz1: `QuizCard`, the cube over `Quiz Time` |
| 64 `quiz-close` (quiz0, `ClassroomQuiz`) | `quiz-close-card` | quiz1: `QuizCard` |

Numbers are the shared file's own order before this pass. Nothing else changed.
