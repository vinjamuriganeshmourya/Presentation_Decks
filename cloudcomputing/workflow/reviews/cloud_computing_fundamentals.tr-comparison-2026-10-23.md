# Cloud Computing Fundamentals: deck against the TR doc, slide by slide (2026-10-23)

**Date:** 2026-10-23. Supersedes `cloud_computing_fundamentals.tr-comparison.md` (2026-10-22), which was made on the 69-slide deck before the PDF re-sync; every row below is re-derived from today's render.

**Inputs**

| | |
|---|---|
| TR doc | `Reference ppt's/1. Cloud Computing Fundamentals.pdf`: agenda, 25 TR slides in 5 sections, Key Takeaways, Upcoming Session, Thank You. Text extracted to `scratchpad/tr/tr.txt`; its two embedded images `img-000.png` (page 3, "Cloud Computing Architecture", nine numbered boxes, `Front End` / `Back End`) and `img-001.png` (page 8, five Title Case boxes round the word `Cloud`) |
| Deck | a frozen copy of `Outputs/cloudcomputing/cloud_computing_fundamentals` as of this morning (`scratchpad/frozen2/deck`, `src/decks/cloudDeck.tsx`, 68 slides), read from the rendered DOM: Playwright (Brave) opened `http://127.0.0.1:5271/?all#/N` for N = 1 to 68 and dumped each slide's `section.innerText` plus svg text and `alt` / `aria-label` strings (`scratchpad/parta2/dump.mjs`, output `dump.txt`). Speaker notes are read from the `notes:` field in `cloudDeck.tsx` |
| Rules cited | `.claude/skills/slide-content-rules/SKILL.md` (rule numbers), `slide-kit/workflow/TEXT_GUIDELINES.md` (section numbers), and the user's instructions recorded in the session's `CLAUDE.md` (`Outputs/cloudcomputing/cloud_computing_fundamentals/CLAUDE.md`, dated sections) |

**Slide numbering.** Deck slides 1 to 68 in deck order: 1 brand, 2 welcome, 3 agenda, 4 divider 1, 5 why-emerged, 6 nist, 7 nist-points, 8 nist-branches, 9 nist-analogy, 10 onprem-vs-cloud, 11 architecture, 12 drivers, 13 divider 2, 14 four-eras, 15 mainframes, 16 mainframes-2, 17 mainframes-analogy, 18 virtualization, 19 virtualization-2, 20 virtualization-analogy, 21 grid-utility, 22 grid-points, 23 grid-analogy, 24 public-cloud, 25 evolution-table, 26 evolution-rows, 27 quiz, 28 divider 3, 29 five-traits, 30 five-traits-ring, 31 self-service, 32 self-service-2, 33 self-service-analogy, 34 network-access, 35 pooling, 36 pooling-2, 37 pooling-analogy, 38 divider 4, 39 three-overview, 40 elasticity, 41 elasticity-analogy, 42 elasticity-scalability, 43 elasticity-table, 44 measured-service, 45 measured-analogy, 46 divider 5, 47 tradeoffs, 48 tradeoffs-map, 49 capex-opex, 50 capex-points, 51 capex-points-2, 52 capex-analogy, 53 growth-speed, 54 growth-points, 55 lock-in, 56 lock-in-points, 57 lock-in-analogy, 58 cost-overruns, 59 overruns-points, 60 overruns-analogy, 61 latency-residency, 62 latency-points, 63 benefit-risk, 64 quiz, 65 takeaways, 66 next-session, 67 thank-you, 68 all-the-best. "TR slide N" is the PDF's own numbering, 1 to 25.

**Summary.** 57 of the 68 deck slides differ from the TR in at least one on-slide string; 11 are verbatim or carry no TR text (1, 16, 26, 27, 30, 32, 36, 43, 48, 51, 64). Of the 57: 23 differ only by a dropped trailing full stop or the TR's own typographic slips (rule 36); 5 split a `label: body` line into a tile title over its body with sentence case (5, 8, 14, 24, 39); 3 substitute a banned mark or word (rule 1 on 15 and 44, rule 26 on 34); 3 still carry the 2026-10-15 review's copy where the PDF reads differently (the lead and title of 12, the lead of 18, the shortened client and server definitions on 19), because the 2026-10-22 re-sync replaced the bullets on those slides but not the leads; 11 are analogy slides, where the TR sentence is on screen as scene labels and one claim and the sentence itself sits in `notes`; 11 are kit or user-instruction frames (2, 3, 4, 13, 28, 38, 46, 65, 66, 67, 68); 1 is the architecture image with its two case changes (11). Yesterday's headline is closed: the seven point slides (22, 31, 50, 54, 56, 59, 62) and slide 34 now carry the PDF's bullets word for word, slide 6 is the SP 800-145 sentence again, `Business value`, `Reserved Instances`, `(IaC)` and the `Latency:` label are back and `GDPR` is gone. Section 2 lists 11 pieces of TR content on no slide: the largest is the five agenda sub lines (`Definition & the NIST view; …` and the other four), which the agenda, the dividers and now the Key Takeaways all omit, so the TR's own detail of what each section covers appears nowhere on screen; the others are TR slide 7's VM gloss and its two client-server sentences, six unlabelled analogy clauses (9, 17, 20, 23, 33, 41), and the word `Cloud` at the centre of the traits ring. No speaker note is dropped entirely; twelve lose their second sentence.

**Reason codes.** **R1** rule 1 (spaced em dash banned; colon or comma instead) · **R36** rule 36 (no full stop at the end of a line; two sentences become two lines) · **R26** rule 26 (`via` and `e.g.` banned; write active not passive) · **R39** rule 39 (the agenda mark says `Agenda`) · **R12b** rule 12b "Never print a session number on a slide" · **R2b** rule 2b (the `Next Session` kicker is the one permitted session reference) · **R21** rule 21 (the kit `WelcomeSlide` owns the welcome line) · **R20** rule 20 (Key Takeaways restates the agenda verbatim) · **R18 / R28** rules 18 and 28 (quiz frames, and what they carry) · **R41** rule 41 (the closing order Thank You, All the Best) · **SC** the 2026-10-16 review's "sentence case on every label" (session `CLAUDE.md`; `.text-audit.mjs`) · **REV-15** the 2026-10-15 review's copy, applied on the user's word (session `CLAUDE.md`: "Slide 11 and 16 copy is the review's, word for word", old numbers, today's 12 and 18) · **REV-16** the 2026-10-16 review (agenda "five titles only, no sub lines"; "title slides show only the title") · **SYNC-22** the 2026-10-22 second pass "Re-synced to the TR PDF (the PDF is the later revision)" on 6, 11, 12, 18, 19, 22, 31, 34, 48, 50, 54, 56, 59, 62, with analogy clauses added on 37, 45, 52, 60 · **USER-22** 2026-10-22, "Feedback slide: Delete it" (rule 41 overridden for this deck) · **USER-23** 2026-10-23, "Slide 65: the five agenda titles only" · **SPLIT** a TR slide becomes a statement slide, a points slide, a picture slide and an analogy slide (session `CLAUDE.md` 2026-10-15 and 2026-10-16 "Splits"); or a `label: body` bullet rendered as a tile title over its body (the figure's own shape, no written rule) · **ANALOGY** the deck's analogy grammar: a drawn scene with short labels, `SAME IDEA`, the cloud side's labels, one claim line; the TR sentence goes to `notes` through `analogy()` in `cloudDeck.tsx` with the em dash made a comma (R1) · **VG** a label lifted from the TR's Visual Guidance line (not TR content) · **IMG** a TR embedded image reproduced as a drawn figure.

---

## 1. Changed wording

One row per changed string, in deck order. Cells are verbatim; long cells are trimmed to the differing phrase with "…". A slide absent from this section is either verbatim or has no TR text (section 3).

### Opening (TR title page and agenda)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 2 | `Session 1 : Cloud Computing Fundamentals` | `Welcome to Today’s Session` / `Cloud Computing Fundamentals` | R12b (no session number); the kicker is the kit `WelcomeSlide`'s fixed line (R21) |
| 3 | `Agenda for Today's Session` | kicker `Cloud Computing Fundamentals`, title `Agenda` | R39 |
| 3 | `1. Cloud Computing Basics: Definition & the NIST view; on-premise IT vs cloud; drivers: cost, scale & speed` (and items 2 to 5 likewise) | `1` / `Cloud Computing Basics` (and `2` … `5` with the title only) | REV-16 ("five titles only, no sub lines"). The sub lines are on no slide at all now: see section 2 |
| 4, 13, 28, 38, 46 | `SECTION 1: 1. Cloud Computing Basics` (and sections 2 to 5) | `01` / `Cloud Computing Basics` (and `02` … `05`) | kit `SectionBreakerSlide` numeral; the subtitle (the agenda sub line) was removed by REV-16 ("title slides show only the title"). No word of the title changed |

### TR slide 1 (Why Cloud Computing Emerged) → deck 5

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 5 | `…locking capital years before the load actually arrives.` | `…locking capital years before the load actually arrives` | R36 |
| 5 | `On-premise IT: organisation buys, installs, maintains hardware` | `On-premise IT` / `Organisation buys, installs, maintains hardware` | SPLIT (panel title over body) + SC (capital O) |
| 5 | `Cloud IT: computing rented as a metered service` | `Cloud IT` / `Computing rented as a metered service` | SPLIT + SC |
| 5 | `Shift driven by cost, scale and speed pressures` | unchanged | |

### TR slide 2 (Defining Cloud Computing Formally) → deck 6 (definition), 7 (four points), 8 (three branches), 9 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 6 | `The National Institute of Standards and Technology (NIST) defines cloud computing as a model for enabling anywhere, … with minimal management effort or service provider interaction.` | the same sentence, ending `…or service provider interaction` | R36 only. SYNC-22 restored the SP 800-145 wording (yesterday it was the review's shorter sentence) |
| 6 | (none; visual guidance says "Central box labelled 'NIST Definition'") | label `NIST Definition` | VG |
| 7 | `Five essential characteristics govern shared resource access .` | `Five essential characteristics govern shared resource access` | R36 (and the TR's stray space before the stop) |
| 7 | `Three service models: IaaS, PaaS, SaaS .` | `Three service models: IaaS, PaaS, SaaS` | R36 |
| 7 | `Four deployment models: public, private, hybrid, community .` | `Four deployment models: public, private, hybrid, community` | R36 |
| 7 | `AWS Management Console exposes this self-service resource catalog .` | `AWS Management Console exposes this self-service resource catalog` | R36 |
| 8 | `Five essential characteristics govern shared resource access` | `Essential Characteristics` / `Five of them` (+ leaf chips `On-demand self-service` … `Measured service`) | SPLIT (the visual guidance's three-box tree is its own slide); the branch names are the visual guidance's; `Five of them` and the leaf chips are the deck's (section 3) |
| 8 | `Three service models: IaaS, PaaS, SaaS` | `Service Models` / `IaaS, PaaS, SaaS` (+ chips `IaaS` `PaaS` `SaaS`) | SPLIT, as above |
| 8 | `Four deployment models: public, private, hybrid, community` | `Deployment Models` / `Public, private, hybrid, community` (+ chips `Public` `Private` `Hybrid` `Community`) | SPLIT + SC (`Public`) |
| 9 | `Renting a furnished apartment instead of constructing a house gives instant living space without owning bricks or cement — just as cloud computing gives access to configurable computing resources on demand without owning the underlying infrastructure.` | scene labels `Ready to use`, `A furnished apartment`; `SAME IDEA`; `Servers`, `Storage`, `Networks`, `Applications`, `Cloud computing`; claim `Move in, do not build` | ANALOGY. Kicker `Cloud Computing Defined`, title `Analogy` are the deck's. The ownership clause has no label: section 2 |

### TR slide 3 (On-Premise IT vs Cloud) → deck 10 (lead, panels, table) and 11 (the page-3 image)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 10 | `…to a provider, delivered over the network.` | `…to a provider, delivered over the network` | R36 |
| 10 | table, five rows (`Aspect` / `On-Premise IT` / `Cloud`, `Ownership` … `Provider-managed`) | unchanged | |
| 10 | (none; visual guidance: "left a locked data-centre building, right a cloud icon reachable from anywhere over the internet") | panel labels `On-Premise IT` / `A locked data centre`, `Cloud` / `Reachable from anywhere over the internet` | VG |
| 11 | image: `Cloud Computing Architecture`, `1 Client Infrastructure`, `Front End`, `9 Internet`, `2 Application`, `3 Service`, `4 Runtime Cloud`, `5 Storage`, `6 Infrastructure`, `7 Management`, `8 Security`, `Back End` | title `Cloud Computing Architecture`; every numbered label reproduced; `Front end` / `Back end` | IMG + SC (SYNC-22 brought the two side labels from the capitals `FRONT END` / `BACK END` to sentence case; the image itself has Title Case). Kicker `On-Premise vs Cloud` is TR slide 3's heading, whose page carries the image; caption `Management and security run down both sides` is the deck's own (section 3) |

### TR slide 4 (Cost Scale and Speed Drivers) → deck 12

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 12 | subheading `Cost Scale Speed` | title `Cost, Scale and Speed` | REV-15. No rule; the review's own title |
| 12 | `Three pressures push organisations toward cloud: unpredictable cost of owning hardware, difficulty scaling for sudden demand, and slow speed of provisioning new infrastructure.` | `Organisations adopt cloud computing to reduce infrastructure costs, handle changing demand, and provision resources faster.` | REV-15, still in place: SYNC-22 re-synced the three cards below but not this lead. It also keeps its full stop (R36 not applied). The same three ideas, none of the TR's words |
| 12 | `Cost: Pay for what you use instead of maintaining unused hardware.` and the TR's truncated line `pEx to pay-per-use OpEx, cuts idle capacity` | `Cost:` / `Pay for what you use instead of maintaining unused hardware` / `Converts CapEx to pay-per-use OpEx, cuts idle capacity` | SYNC-22 + SPLIT + R36. The second line is the full sentence the PDF cut the head off (`Converts Ca`), taken from the deck's source build `Reference ppt's/cloud-computing-fundamentals 1.html`; no rule, a repair |
| 12 | `Scale: resources added or removed as demand shifts` | `Scale:` / `Resources added or removed as demand shifts` | SPLIT + SC |
| 12 | `Speed: servers provisioned in minutes, not procurement cycles` | `Speed:` / `Servers provisioned in minutes, not procurement cycles` | SPLIT + SC |
| 12 | `Reflected in tools like AWS Cost Explorer, Pricing Calculator` | unchanged | |
| 12 | (none; visual guidance: "one arrow marked 'Cloud Adoption'") | `Cloud Adoption`; tiles `Before` / `Cloud` under each card, `6` | VG; the tiles and the count are the deck's (section 3) |

### TR slide 5 (Four Eras of Computing Evolution) → deck 14

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 14 | `…each solving the resource-sharing problem of its own time.` | `…each solving the resource-sharing problem of its own time` | R36 |
| 14 | `1960s-70s: mainframes & time-sharing` | `1960s-70s` / `Mainframes & time-sharing` | SPLIT (period over label) + SC |
| 14 | `1980s-2000s: client-server & x86 virtualization` | `1980s-2000s` / `Client-server & x86 virtualization` | SPLIT + SC |
| 14 | `1990s-2000s: grid & utility computing` | `1990s-2000s` / `Grid & utility computing` | SPLIT + SC |
| 14 | `2006 onward: the public cloud era` | `2006 onward` / `The public cloud era` | SPLIT + SC (the leading `The` is kept, against `TEXT_GUIDELINES.md` §4a-bis; no one has applied that section to this deck) |

### TR slide 6 (Mainframes and the Rise of Time-Sharing) → deck 15 (lead and points), 16 (picture), 17 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 15 | `…let many users access the same machine at once.` | `…let many users access the same machine at once` | R36 |
| 15 | bullets 1 to 4 (`Mainframes: centralised, costly machines run by dedicated operators` · `Batch processing: jobs queued and run without interaction` · `Time-sharing (1960s): CPU scheduled across simultaneous terminal users` · `Each user experienced an illusion of a private computer`) | unchanged | |
| 15 | `IBM's CP-40/CP-67 (1960s) pioneered mainframe virtualization — the earliest form of the concept` | `IBM's CP-40/CP-67 (1960s) pioneered mainframe virtualization: the earliest form of the concept` | R1 |
| 16 | (none; visual guidance: "Mainframe box with several terminal lines converging on it, a small clock icon marking scheduled turns") | `Jobs queued`, `Scheduled turns`, `Mainframe`, `CPU scheduled across simultaneous terminal users`, `VM` ×3, `CP-40/CP-67`, `Terminal` / `My computer` ×4 | SPLIT (picture slide, 2026-10-16); labels are the TR bullets' words rearranged (`My computer` for `illusion of a private computer`). No TR sentence changed |
| 17 | `A library reading room with one shared encyclopedia set, where each reader gets a scheduled turn at the desk — just as time-sharing gave every terminal user a scheduled turn on one mainframe.` | `Turn 1` to `Turn 4`, `A library reading room`; `SAME IDEA`; `Turn 1` to `Turn 4`, `Time-sharing`; claim `Everyone gets a scheduled turn` | ANALOGY. `one shared encyclopedia set` and `on one mainframe` are drawn, not labelled: section 2 |

### TR slide 7 (Client-Server Shift and Virtualization) → deck 18 (lead and points), 19 (picture with the client and server definitions), 20 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 18 | `Personal computers and networks split work into client requests and dedicated servers; virtualization then let one physical server run several independent virtual machines — self-contained, software-based "computers" that each run their own OS .` | `Clients request services from servers. Virtualization allows one physical server to run multiple isolated virtual machines (VMs), each with its own OS.` | REV-15, still in place: SYNC-22 re-synced the four bullets below but not this lead. Two sentences on one line with full stops (R36 not applied). The VM gloss `self-contained, software-based "computers"` is on no slide: section 2 |
| 18 | `1980s-90s: client-server split desktop and network-server roles` | unchanged | |
| 18 | `Commodity x86 virtualization (late 1990s onward, e.g. VMware): a hypervisor — the software layer that creates and manages VMs — partitions one server` | `Commodity x86 virtualization (late 1990s onward, for example VMware): a hypervisor, the software layer that creates and manages VMs, partitions one server` | R26 (`e.g.` → `for example`) + R1 (the paired dashes → commas) |
| 18 | `Each virtual machine runs its own OS, isolated from others` · `Decouples software from physical hardware, enabling resource pooling` | unchanged | |
| 18 | (none) | `Hypervisor`, `One server` | picture labels (section 3) |
| 19 | `Clients: Computers used by people to access applications and services.` | `Clients: computers people use to access applications and services` | SYNC-22 placed the TR's two definitions on the picture slide. Passive `used by people` → active `people use` (R26 "write active not passive"); SC; R36 |
| 19 | `Servers: Computers designed to provide data, applications, or services to other computers.` | `Servers: computers that provide data, applications, or services` | SYNC-22; SC; R36. `designed` and `to other computers` dropped: no rule; likely trimmed to the picture label's width |
| 19 | `1980s–90s: Client computers sent requests to dedicated servers.` | label `Requests` (an arrow from `Client: the desktop` to the server) | the sentence is drawn as the arrow; only its noun is on screen. `This allowed many clients …` and `Next: …` from the same block are absent: section 2 |
| 19 | (none; visual guidance: "physical server box, hypervisor layer above it, three VM boxes each with its own OS icon") | `Client: the desktop`, `VM` / `Its own OS` ×3, `Hypervisor`, `One physical server`, `Isolated virtual machines`, `Better resource utilization`, `Hardware independence` | SPLIT picture slide. The last two are the 2026-10-15 review's `Benefit:` bullet surviving as labels (REV-15); US spelling `utilization` against the TR's `organisation`, `centralised` |
| 20 | `One large plot subdivided into separate, locked apartments by a building's structure — just as a hypervisor partitions one physical server into isolated virtual machines, each unaware of its neighbours.` | `1` `2` `3`, `One plot`, `One plot, locked apartments`; `SAME IDEA`; `VM` / `Its own OS` ×3, `Hypervisor`, `One physical server`, `Virtual machines`; claim `One space, divided and locked` | ANALOGY. `by a building's structure` and `each unaware of its neighbours` have no label: section 2 |

### TR slide 8 (Grid Computing and Utility Computing) → deck 21 (lead), 22 (points and picture), 23 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 21 | `…billing that powers the way electricity is billed.` | `…billing that powers the way electricity is billed` | R36 (the TR's own odd phrase is kept as is) |
| 22 | `Grid computing:Combines unused processing power from many computers for large tasks.` | `Grid computing: Combines unused processing power from many computers for large tasks` | SYNC-22 (the PDF's bullet, replacing the source build's); R36; the TR's missing space after the colon restored |
| 22 | `Example : Scientific projects use processing power from many participating computers.` | `Example: Scientific projects use processing power from many participating computers` | SYNC-22; R36; the TR's stray space before the colon removed |
| 22 | `Utility computing: Pay for the computing capacity you actually use, rather than owning it.` | `Utility computing: Pay for the computing capacity you actually use, rather than owning it` | SYNC-22; R36 |
| 22 | `Key idea: Both concepts separate resource usage from hardware ownership, paving the way for cloud computing.` | `Key idea: Both concepts separate resource usage from hardware ownership, paving the way for cloud computing` | SYNC-22; R36 |
| 22 | (none; visual guidance: "multiple institution icons linked into one central grid; a separate metering gauge icon beside it") | `Institution` ×3, `One grid`, `Idle CPUs combined for shared jobs`, `Metered billing`, `Owned: stays with each institution`, `Consumed: paid by use` | VG for the first two; `Idle CPUs combined for shared jobs` is the source build's old grid bullet, still on the picture after the bullet above it was re-synced; `Owned:` / `Consumed:` are the deck's (section 3) |
| 23 | `Several small businesses sharing one shipping company's trucks, pooling partial loads and paying only for the weight each one ships — just as grid computing pools spare processing power and utility computing bills only for capacity consumed.` | `2 kg`, `5 kg`, `3 kg`, `Pay by weight`, `One shipping company's trucks`; `SAME IDEA`; `Pooled processing power`, `Metered billing`, `Grid and utility computing`; claim `Pool the load, pay your share` | ANALOGY. `Several small businesses` has no label: section 2 |

### TR slide 9 (The Public Cloud Era Begins) → deck 24

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 24 | `…directly over the internet, on demand.` | `…directly over the internet, on demand` | R36 |
| 24 | `2006: Amazon Web Services launches S3 storage, then EC2 compute` (and the 2008 and 2010 lines) | `2006` / `Amazon Web Services launches S3 storage, then EC2 compute` (2008 and 2010 likewise) | SPLIT (year over label) |
| 24 | `By the 2010s: public cloud becomes the default for new IT` | `By the 2010s` / `Public cloud becomes the default for new IT` | SPLIT + SC |
| 24 | (none; visual guidance: "a rising adoption curve beneath") | `Adoption` | VG |

### TR slide 10 (Evolution Timeline and Legacy Summary) → deck 25 (lead), 26 (table)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 25 | `…to metered, on-demand delivery over the internet.` | `…to metered, on-demand delivery over the internet` | R36 |
| 26 | table, four rows | unchanged; the ribbon `1960s-70s` `1980s-2000s` `1990s-2000s` `2006 onward` above it is the visual guidance's "slim timeline ribbon" (VG) | |

### TR slide 11 (NIST Essential Characteristics) → deck 29 (lead), 30 (ring and the five glosses)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 29 | `…that distinguishes cloud from traditional IT.` | `…that distinguishes cloud from traditional IT` | R36 |
| 30 | five bullets (`On-demand self-service: provisioning without human intervention` … `Measured service: usage metered and billed per consumption`) | unchanged, as the rail beside the ring | |
| 30 | image: `On-Demand Self-Service`, `Broad Network Access`, `Resource Pooling`, `Rapid Elasticity`, `Measured Service` round the word `Cloud` | the five boxes in the image's Title Case; the centre holds a small picture of the lit trait | IMG. The one word the image has that the boxes do not, `Cloud`, is not on the slide: section 2 |

### TR slide 12 (On-Demand Self-Service Explained) → deck 31 (lead and points), 32 (picture), 33 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 31 | `…without requiring a phone call or ticket to the provider's staff.` | `…without requiring a phone call or ticket to the provider's staff` | R36 |
| 31 | `Choose the resources you need using a cloud console, command, or API` · `No need to wait for IT staff or lengthy hardware-procurement processes` · `For example, AWS lets you launch a virtual server (EC2) with a few clicks` | unchanged | SYNC-22 (the PDF's three bullets replaced the source build's; the `via` yesterday's report flagged is gone with them) |
| 32 | (none; visual guidance: "AWS console 'Launch Instance' button highlighted, arrow showing instant provisioning with no approval step in between") | `Manager`, `Finance`, `IT desk`, `Week 6`, `Weeks-long procurement ticket`, `Console`, `CLI`, `API`, `EC2`, `Launch Instance`, `Resources provisioned`, `Without human intervention` | SPLIT picture slide; `Launch Instance` is VG; `Without human intervention` is the TR subheading reused; the rest is the deck's (section 3) |
| 33 | `An ATM lets a customer withdraw cash any time, without a bank clerk approving each transaction — just as on-demand self-service lets a customer provision cloud resources instantly without provider staff involvement.` | `Cash out`, `No queue, no clerk`, `An ATM`; `SAME IDEA`; `Launch Instance`, `Ready`, `Nobody to ask first`, `On-demand self-service`; claim `Nobody to ask first` | ANALOGY (`Nobody to ask first` appears twice: a scene label and the claim). `any time` has no label: section 2 |

### TR slide 13 (Broad Network Access) → deck 34

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 34 | `…from heterogeneous client devices, laptops, phones or thin clients alike.` | `…from heterogeneous client devices, laptops, phones or thin clients alike` | R36 |
| 34 | `Uses standard protocols: HTTPS APIs, SDKs, browser console` · `Same service reachable from laptop, mobile app, CLI` · `No proprietary client software required, unlike legacy systems` | unchanged | SYNC-22 ("34 (TR's four bullets beside a 700px device stage)"); yesterday none of the four was on the slide |
| 34 | `AWS: identical API reachable via Console, CLI, SDK, mobile app` | `AWS: identical API reachable through Console, CLI, SDK, mobile app` | R26 (`via` → `through`). Note the same word is left as is on 35 and 63 |
| 34 | (none; visual guidance: "single AWS icon at centre, arrows fanning out to laptop, phone, browser and CLI-terminal icons, each arrow labelled 'HTTPS/API'") | `HTTPS/API` ×4, `AWS API`, `Laptop`, `Mobile app`, `Browser console`, `CLI` | VG |

### TR slide 14 (Resource Pooling & Multi-Tenancy) → deck 35 (lead and points), 36 (picture), 37 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 35 | `…assigned dynamically rather than dedicated per customer.` | `…assigned dynamically rather than dedicated per customer` | R36 |
| 35 | four bullets (`Multi-tenancy: …` · `Hypervisor: …` · `Location independence: …` · `AWS: EC2 hosts run multiple tenants via shared hypervisor`) | unchanged | the TR's own `via` is kept here, so R26 is applied on 34 and not on 35; no reason recorded |
| 36 | (none; visual guidance: "one physical server icon with a hypervisor layer, three tenant boxes (A, B, C) each drawing a slice dynamically from the shared pool") | `Tenant A` / `2 slices now`, `Tenant B` / `3 slices now`, `Tenant C` / `1 slice now`, `A A B B B C`, `Hypervisor`, `Shared physical hardware`, `EC2 host: many tenants` | SPLIT picture slide; `Tenant A/B/C` and `Hypervisor` are VG, the rest the deck's (section 3) |
| 37 | `A hostel mess kitchen serves many students from one shared stock of vessels, portioning food on demand instead of giving each student a dedicated stove — exactly as resource pooling shares infrastructure dynamically across tenants.` | `No stove per student`, `A hostel mess kitchen`; `SAME IDEA`; `One shared pool`, `Shares infrastructure dynamically across tenants`, `Resource pooling`; claim `One stock, portions on demand` | ANALOGY; the cloud-side clause was added by SYNC-22. Nothing of the sentence is now unlabelled |

### TR slide 15 (Elasticity Scalability And Measured Service) → deck 39

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 39 | `Cloud platforms must absorb changing demand and charge only for what gets used. Three characteristics make that possible: rapid elasticity, scalability, and measured service.` | `Cloud platforms must absorb changing demand and charge only for what gets used` / `Three characteristics make that possible: rapid elasticity, scalability, and measured service` | R36 (two sentences become two lines) |
| 39 | `Rapid elasticity: automatic scale-out and scale-in with demand` | `Rapid elasticity` / `Automatic scale-out and scale-in with demand` | SPLIT + SC |
| 39 | `Scalability: capacity to grow, vertically or horizontally` | `Scalability` / `Capacity to grow, vertically or horizontally` (+ picture labels `Vertically`, `Horizontally`, `Demand`, `5 of 6 servers in use`) | SPLIT + SC; the picture labels are the deck's (section 3) |
| 39 | `Measured service: usage tracked and billed per resource consumed` | `Measured service` / `Usage tracked and billed per resource consumed` | SPLIT + SC |

### TR slide 16 (Rapid Elasticity Explained) → deck 40 (lead, points, chart), 41 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 40 | `…as demand rises or falls.` | `…as demand rises or falls` (the TR's spaced hyphen in `resources - in most cases` is kept; it is a hyphen, not an em dash) | R36 |
| 40 | four bullets (`Triggered by real-time metrics, such as CloudWatch alarms` … `Cost: extra capacity billed only while it actually runs`) | unchanged | |
| 40 | (none; visual guidance: "Timeline graph showing traffic spike with instance-count line rising then falling back to baseline, an Auto Scaling Group icon triggering the change") | `Demand`, `Instance count`, `CloudWatch alarm`, `Time`, `CloudWatch alarm triggers the Auto Scaling Group`, `Billing 8 instances now` | VG for the axes; the marker sentence and the billing chip are the deck's (section 3) |
| 41 | `A rubber band stretches under load and springs back once released — just as auto-scaled capacity expands during a spike and contracts once demand fades.` | `Stretched under load`, `A rubber band`; `SAME IDEA`; `6 instances`, `Rapid elasticity`; claim `Stretch, then spring back` | ANALOGY. The cloud-side clause `auto-scaled capacity expands during a spike and contracts once demand fades` has no label (this slide did not get the clause the four others got in SYNC-22): section 2 |

### TR slide 17 (Elasticity Vs Scalability Compared) → deck 42 (lead and chart), 43 (table)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 42 | `…can absorb growth at all.` | `…can absorb growth at all` | R36 |
| 42 | (none; visual guidance: "Side-by-side bar chart: instance count over time showing elasticity's spike-and-return versus a step-change resize for scalability") | `Elasticity` / `Instance count`, `Scalability` / `Instance size` | VG; the table moved to 43 (SPLIT, 2026-10-15: "34 splits as chart, then table", old number) |
| 43 | table (`Aspect` / `Elasticity` / `Scalability`, four rows) | unchanged (`Scales out and back  in` loses the TR's double space) | |

### TR slide 18 (Measured Service And Metering) → deck 44 (lead, points, dials), 45 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 44 | `…so bills map directly to actual consumption.` | `…so bills map directly to actual consumption` | R36 |
| 44 | bullets 1 to 3 (`Metrics tracked: …` · `CloudWatch collects usage; Billing and Cost Explorer compute charges` · `Granular units: …`) | unchanged | |
| 44 | `No usage recorded means no charge — true pay-per-use pricing` | `No usage recorded means no charge: true pay-per-use pricing` | R1 |
| 44 | (none; visual guidance: "Meter icon feeding into a billing dashboard graphic, with small tags showing per-second, per-GB and per-request units") | `Compute-seconds` / `In use` (×4 metrics), `CloudWatch`, `Billing and Cost Explorer`, `metered` ×4, `EC2 per-second`, `S3 per-GB-month`, `Lambda per-request`, `4 metered` | the bullets' words reused as dial and bill labels; `In use`, `metered`, `4 metered` are the deck's (section 3) |
| 45 | `A household electricity meter records exactly how many units are consumed, and the bill reflects only that usage — just as cloud providers meter every compute-second and byte served, billing only for actual use.` | `2 on, the meter turns`, `A household electricity meter`; `SAME IDEA`; `2 running, 2 billed`, `Meters every compute-second and byte served`, `Measured service`; claim `Billed for what was used` | ANALOGY; the cloud-side clause was added by SYNC-22 |

### TR slide 19 (Cloud Benefits And Challenges Overview) → deck 47 (lead), 48 (scale and the eight cells)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 47 | `…separates sound architecture decisions from costly surprises.` | `…separates sound architecture decisions from costly surprises` | R36 |
| 48 | `Benefits` / `Challenges` and the eight cells (`Cost model shift (CapEx→OpEx)` … `Data residency`) | unchanged | SYNC-22 ("48 (sentence case heads)") undid yesterday's `BENEFITS` / `CHALLENGES` |

### TR slide 20 (Cost Model Shift From CapEx To OpEx) → deck 49 (lead), 50 (points), 51 (graph), 52 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 49 | `On-premise IT demands large upfront capital expenditure on hardware before any workload runs. Cloud shifts most of that spend to metered operating expenditure, billed for resources as they're consumed.` | `On-premise IT demands large upfront capital expenditure on hardware before any workload runs` / `Cloud shifts most of that spend to metered operating expenditure, billed for resources as they're consumed` | R36 (two lines, no stops) |
| 50 | `No upfront hardware: Avoid large hardware purchases and depreciation costs.` | `No upfront hardware: Avoid large hardware purchases and depreciation costs` | SYNC-22 ("50 (five rows, Reserved Instances its own)"); R36 |
| 50 | `Usage-based spending: Costs increase or decrease with resource usage.` | `Usage-based spending: Costs increase or decrease with resource usage` | SYNC-22; R36 |
| 50 | `Reserved Instances: Commit to usage for a lower price, with less flexibility.` | `Reserved Instances: Commit to usage for a lower price, with less flexibility` | SYNC-22; R36 (yesterday this sat inside a parenthesis) |
| 50 | `Business benefit: Free up capital for other business needs.` | `Business benefit: Free up capital for other business needs` | SYNC-22; R36 |
| 50 | `Cost tracking: AWS Cost Explorer and Billing Dashboard help monitor spending.` | `Cost tracking: AWS Cost Explorer and Billing Dashboard help monitor spending` | SYNC-22; R36 |
| 51 | (none; visual guidance: "Two bars side by side: a tall one-time CapEx spike versus a flat recurring OpEx line over time") | `CapEx` / `Yr 1` to `Yr 4`, `OpEx` / `Yr 1` to `Yr 4`, `Reserved Instances: on`, `Capital kept for the business`, `Cost Explorer` | SPLIT picture slide (2026-10-16); `CapEx` / `OpEx` are VG, the rest the deck's (section 3). The switch reads `on` on the harness frame because it throws once at 3.2s (2026-10-22 polish pass) |
| 52 | `Renting a taxi for occasional trips avoids buying and maintaining a car that sits idle most days — exactly as OpEx cloud billing avoids owning hardware capacity that sits unused.` | `Meter: trip 5 of 6`, `Owned car, idle most days`, `Loan, insurance, upkeep`, `Renting a taxi`; `SAME IDEA`; `Trip 1` to `Trip 6`, `Pay per use, nothing between trips`, `No hardware capacity sitting unused`, `OpEx cloud billing`; claim `Pay for the trip, not the car` | ANALOGY; the cloud-side clause was added by SYNC-22 |

### TR slide 21 (Elasticity, Global Reach And Speed To Market) → deck 53 (lead), 54 (points and picture)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 53 | `…worldwide presence and lower idle spend.` | `…worldwide presence and lower idle spend` | R36 |
| 54 | `Elasticity: Automatically scale resources up or down as demand changes.` | `Elasticity: Automatically scale resources up or down as demand changes` | SYNC-22 (the PDF's bullets replaced the source build's); R36 |
| 54 | `Global reach: Deploy applications across AWS Regions worldwide.` | `Global reach: Deploy applications across AWS Regions worldwide` | SYNC-22; R36 |
| 54 | `Speed to market: Launch applications and services faster.` | `Speed to market: Launch applications and services faster` | SYNC-22; R36 |
| 54 | `Business value: Scale easily, reach more users, and reduce idle costs.` | `Business value: Scale easily, reach more users, and reduce idle costs` | SYNC-22 ("54 (Business value added)"); R36. Absent yesterday |
| 54 | `Real-world: AWS Auto Scaling groups, Global Infrastructure Region map` | unchanged | |
| 54 | (none; visual guidance: "World map with AWS Region markers lighting up one after another, alongside a rising-then-falling autoscaling curve") | `Load and spend`, `Load`, `Spend`, `10 Regions`, `Production in days`, `Buying hardware: months`, caption `The AWS Global Infrastructure page, showing Regions worldwide` | picture labels and a real capture's caption; the deck's (section 3) |

### TR slide 22 (Vendor Lock-In And Switching Costs) → deck 55 (lead), 56 (points and picture), 57 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 55 | `…makes moving a workload elsewhere slow, risky and expensive.` | `…makes moving a workload elsewhere slow, risky and expensive` | R36 |
| 56 | `Proprietary services : Services like Lambda and DynamoDB can make applications harder to move.` | `Proprietary services: Services like Lambda and DynamoDB can make applications harder to move` | SYNC-22; R36; the TR's stray space before the colon removed |
| 56 | `Data egress fees: Moving data out of a provider can add extra costs.` | `Data egress fees: Moving data out of a provider can add extra costs` | SYNC-22; R36 |
| 56 | `Specialized skills: Teams may become dependent on one provider's tools.` | `Specialized skills: Teams may become dependent on one provider's tools` | SYNC-22; R36 (the TR's US spelling kept) |
| 56 | `Mitigation: Use multi-cloud, open standards, and Infrastructure as Code (IaC)` | unchanged | SYNC-22 ("56 (IaC)"): the acronym is back |
| 56 | (none; visual guidance: "Icon of an application boxed inside one provider's logo, with a locked padlock on the arrow pointing toward other providers") | `One provider`, `Your application`, `Lambda triggers`, `DynamoDB APIs`, `Skills in one provider's tools`, `Data egress fees`, `Exit cost`, `Other providers`, `Mitigation: off`, `Moving the application`, `Built from one provider’s parts` | picture labels (section 3); `One provider` is sentence case now (SC, yesterday `ONE PROVIDER`) |
| 57 | `A rented apartment fitted with the landlord's custom cupboards works only in that apartment — just as an application built entirely on one cloud's proprietary APIs runs only on that cloud.` | `Moving out`, `Fitted to this wall`, `Bolted on`, `A landlord's fitted cupboards`; `SAME IDEA`; `One provider`, `Your application`, `Lambda triggers`, `DynamoDB APIs`, `Other providers`, `Built from one provider's parts`, `Vendor lock-in`; claim `Fitted things do not move` | ANALOGY (the scene was redrawn 2026-10-22; `Bolted on` is its one new chip). `proprietary APIs` is shown as two named services rather than the phrase |

### TR slide 23 (Cost Overruns In Pay-Per-Use Billing) → deck 58 (lead), 59 (points and picture), 60 (analogy)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 58 | `…can turn into a large, unexpected bill.` | `…can turn into a large, unexpected bill` | R36 |
| 59 | `Unused resources: Resources left running continue to generate charges.` | `Unused resources: Resources left running continue to generate charges` | SYNC-22; R36 |
| 59 | `Autoscaling: Incorrect settings can increase costs unexpectedly.` | `Autoscaling: Incorrect settings can increase costs unexpectedly` | SYNC-22; R36 |
| 59 | `Extra charges: Data transfer and API usage can add up quickly.` | `Extra charges: Data transfer and API usage can add up quickly` | SYNC-22; R36 |
| 59 | `Cost control: AWS Budgets and Cost Anomaly Detection help identify unusual spending.` | `Cost control: AWS Budgets and Cost Anomaly Detection help identify unusual spending` | SYNC-22; R36 |
| 59 | (none; visual guidance: "A steadily climbing bill graph with a red spike where an unmonitored resource kept running") | `Resources`, `Forgotten, running`, `Data transfer`, `API calls`, `Monthly bill`, `An unmonitored resource kept billing`, `Budgets alert: abnormal spend` | VG for the marker line; the rest the deck's (section 3) |
| 60 | `Leaving international roaming switched on during travel racks up charges unnoticed until the bill arrives — just as unmonitored cloud resources keep billing until the invoice reveals the overrun.` | `International roaming left on during travel`, `Charges grow overnight`, `Roaming left switched on`; `SAME IDEA`; `Forgotten, still running`, `Billing until the invoice`, `Cost overruns`; claim `Left on, still charging` | ANALOGY; `International … during travel` was added by SYNC-22 |

### TR slide 24 (Latency And Data Residency Challenges) → deck 61 (lead), 62 (points and map)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 61 | `…regardless of which Region is closest.` | `…regardless of which Region is closest` | R36 |
| 62 | `Latency: Choose a nearby AWS Region or CDN edge location to reduce network delay.` | `Latency: Choose a nearby AWS Region or CDN edge location to reduce network delay` | SYNC-22 ("62 (Latency label back, GDPR gone)"); R36 |
| 62 | `Data residency: Laws and regulations may require certain data to stay within a country.` | `Data residency: Laws and regulations may require certain data to stay within a country` | SYNC-22; R36 |
| 62 | `Region selection: Choose the appropriate AWS Region to meet data residency requirements.` | `Region selection: Choose the appropriate AWS Region to meet data residency requirements` | SYNC-22; R36 |
| 62 | (none; visual guidance: "World map showing a user, a distant Region (long delay arrow) and a nearby Region chosen instead, with a border outline marking a data-residency zone") | `Data residency zone`, `User`, `Nearest Region`, `Distant Region`, `Less delay`, `More delay`, `A request to`, `Nearest Region`, `Distant Region`, `Region chosen at creation` | VG for the zone, user and Regions; `A request to` and `Region chosen at creation` are the deck's (section 3) |

### TR slide 25 (Pairing Cloud Benefits With Their Risks) → deck 63

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 63 | `…is what a sound migration decision requires.` | `…is what a sound migration decision requires` | R36 |
| 63 | table (`Benefit Driving Adoption` / `Matching Risk To Manage`, three rows) | unchanged (`Vendor lock-in via managed services` keeps the TR's `via`; R26 not applied, as on 35) | |

### Closing (TR Key Takeaways, Upcoming Session, Thank You)

| Slide # | TR doc text | Deck text | Why |
|---|---|---|---|
| 65 | `Key Takeaways` then `1. Cloud Computing Basics: Definition & the NIST view; on-premise IT vs cloud; drivers: cost, scale & speed` (and items 2 to 5 with their sub lines) | kicker `Cloud Computing Fundamentals`, title `Key Takeaways`; `Cloud Computing Basics` · `History & Evolution` · `Essential Characteristics - I` · `Essential Characteristics - II` · `Benefits & Challenges` (check discs, no numbers) | USER-23 ("the five agenda titles only"); R20 (the takeaways now match the agenda word for word, which REV-16 had already cut to titles). Yesterday the sub lines were here verbatim; today they are on no slide: section 2 |
| 66 | `Upcoming Session : Deployment & Service Models` | `Next Session` / `Deployment & Service Models` | kit `NextSessionSlide` (fixed kicker); R2b |
| 67, 68 | `Thank You \| All the Best` | `Thank You` (67) and `All the Best` (68), two frames | R41's closing order. The feedback slide R41 places before them was deleted on the user's word (USER-22) |

---

## 2. Not included

TR content on no slide, in TR order. Speaker notes and Visual Guidance lines are not on-slide content and are not listed. An analogy sentence counts as on-slide content; a clause is listed only when no label on the analogy slide carries it.

| TR doc section | Content not on any slide | Why | Where it could go |
|---|---|---|---|
| Agenda (page 2) and Key Takeaways (page 16) | the five sub lines: `Definition & the NIST view; on-premise IT vs cloud; drivers: cost, scale & speed` · `Mainframes & time-sharing; client-server & virtualization; grid & utility computing; the public cloud era` · `On-demand self-service; broad network access; resource pooling & multi-tenancy` · `Rapid elasticity vs scalability; measured service & pay-per-use metering` · `Cost model shift, elasticity, global reach & speed to market; vendor lock-in, cost overruns, latency & data residency` | three user instructions, one per place they used to appear: REV-16 cut them from the agenda ("five titles only, no sub lines") and from the dividers ("title slides show only the title"); USER-23 cut them from the Key Takeaways. They survive only in the source (`AGENDA[].sub`, `cloudDeck.tsx:86-90`) and in slide 3's note, which still says "The sub lines are still the section dividers' subtitles and the Key Takeaways", no longer true | Nowhere on screen without reopening one of those instructions. The honest home now is the speaker notes of slides 3 and 65 and of each divider (4, 13, 28, 38, 46), where the instructor can read out what the section covers; if the user reopens REV-16, the divider subtitle is where the TR put them |
| Section 2, TR slide 7 lead | the VM gloss `self-contained, software-based "computers" that each run their own OS` | the lead on 18 is still REV-15's; SYNC-22 re-synced the four bullets under it but not the lead. Rule 24 asks for exactly this plain-words gloss before the formal name, so this is the one dropped phrase a rule argues for | deck 18, the lead, in place of the review's second sentence (`Virtualization allows one physical server to run multiple isolated virtual machines (VMs), each with its own OS.`) |
| Section 2, TR slide 7, second block | `This allowed many clients to use shared resources from dedicated servers.` | no rule; SYNC-22 carried only the `Clients:` and `Servers:` definitions from this block to 19 | deck 19, a caption under the `Requests` arrow |
| Section 2, TR slide 7, second block | `Next: As the number of servers grew, a new idea emerged — virtualization, which helped use physical servers more efficiently.` | no rule explains the drop (rule 22 bans position words like "next slide", but this `Next:` names an idea, not a slide). Likely left behind with the sentence above it | deck 19, as the caption between the client-server half and the hypervisor half, em dash made a comma (rule 1) |
| Section 1, TR slide 2 analogy (deck 9) | `without owning bricks or cement` / `without owning the underlying infrastructure` | ANALOGY: the claim `Move in, do not build` carries `instead of constructing a house`; the ownership clause, which is the analogy's point, has no label | deck 9, a label under `Cloud computing`, in the form SYNC-22 used on 37, 45, 52, 60 (`No infrastructure to own`) |
| Section 2, TR slide 6 analogy (deck 17) | `one shared encyclopedia set` and `on one mainframe` | ANALOGY: drawn (one book on the desk, one mainframe), not labelled | deck 17, a scene label `One encyclopedia set` and a cloud-side label `One mainframe` |
| Section 2, TR slide 7 analogy (deck 20) | `by a building's structure` and `each unaware of its neighbours` | ANALOGY: the walls are drawn; nothing says the structure does the dividing or that a tenant cannot see the next flat (the deck's own note for the slide says exactly this, so it is known and kept off screen) | deck 20, under `Virtual machines` (`Each unaware of its neighbours`) |
| Section 2, TR slide 8 analogy (deck 23) | `Several small businesses` | ANALOGY: three weights (`2 kg`, `5 kg`, `3 kg`) stand in for the businesses | deck 23, a scene label `Three small businesses` |
| Section 3, TR slide 12 analogy (deck 33) | `any time` (`withdraw cash any time`) | ANALOGY: `Cash out` and `No queue, no clerk` carry the rest of the scene | deck 33, the scene label `Cash out, any time` |
| Section 4, TR slide 16 analogy (deck 41) | `auto-scaled capacity expands during a spike and contracts once demand fades` | ANALOGY: the cloud side says `6 instances` and `Rapid elasticity` only. 41 is the one analogy slide SYNC-22 did not give its cloud-side clause (37, 45, 52, 60 got theirs) | deck 41, under the claim, `Expands in a spike, contracts after` |
| Section 3, TR slide 11 image | the word `Cloud` at the centre of the ring | IMG: the centre holds a small picture of the lit trait instead | deck 30, the ring's centre tile, or left out (the kicker already says `Essential Characteristics`) |

Everything else in the TR is on a slide: every lead, bullet, table cell, era, year and image label is either verbatim or in the reworded form listed in section 1. Yesterday's missing items (`Business value`, `Reserved Instances` as its own line, `(IaC)`, the `Latency:` label, TR slide 13's four bullets, the three cloud-side analogy clauses on 37, 45, 52 and `international … during travel` on 60) are all present today.

**Speaker notes.** No TR speaker note is dropped entirely. Twelve lose part of their text, almost always the second "interview angle" sentence, when a TR slide is split across deck slides: TR 11 (`The next three slides explain on-demand self-service, network access and pooling in more depth.`), 12 (`On-demand self-service removes that human approval step entirely.`), 14 (`This isolation is what makes multi-tenancy safe despite shared physical infrastructure.`), 15 (`Interviewers often ask for a precise definition of each term, so anchor both here.`), 16 (`Interviewers often ask how elasticity differs from simply adding more servers.`), 17 (the middle clause `This exact distinction is a frequent interview question, and`, between the two sentences that are kept on 42 and 43), 18 (`Interviews often ask how pay-per-use differs from fixed licensing.`), 20 (`A common interview question asks to explain CapEx versus OpEx in cloud adoption.`), 21 (`Interviewers may ask how elasticity concretely shortens time-to-market.`), 22 (`Interviewers often probe how open standards or multi-cloud design mitigate it.`), 23 (`A frequent interview question asks how to prevent cloud bill shock in production.`), 24 (`though both push toward the same Region-selection decision. Interviewers may ask why a global application still needs region-specific deployments.`). TR 1 to 10, 13, 19 and 25 are carried in full. The eleven analogy sentences are all in `notes` verbatim except for the em dash (rule 1). Two deck-written notes are stale after the re-sync and are worth a glance, though they are not TR content: slide 50's says "The four points" (five now), and slide 3's says the sub lines are on the dividers and the takeaways (neither, now); several notes also still describe controls removed on 2026-10-16 ("Press Launch Instance", "Drag Time", "Switch a metric off").

---

## 3. On the deck but not in the TR doc

| Deck slide(s) | Content | Note |
|---|---|---|
| 1 | `Welcome!` | kit `BrandSlide` greeting (rule 21); the TR has no brand frame |
| 2 | `Welcome to Today’s Session` | kit `WelcomeSlide` kicker (rule 21) |
| 4, 13, 28, 38, 46 | `01` to `05` | kit divider numerals |
| every content slide (svg only) | `Sections`, `Go to Start`, `Go to Cloud Computing Basics` … `Go to Benefits & Challenges` | the section bar's `aria-label`s (`src/ui/SectionBar.tsx`, 2026-10-23); not visible text |
| 5 | `6 servers bought on a guess`, `4 paid, idle`, `Short by 0: order more, wait weeks`, `6`, `2 billed`, `Demand` | the demand-loop picture's labels (the reference render's own numbers, session `CLAUDE.md` 2026-10-16); `Short by 0` is the held state at demand 0.25 on harness URLs |
| 8 | `Five of them`, `Opened in this session`, the leaf chips `On-demand self-service` … `Measured service`, `IaaS` `PaaS` `SaaS`, `Public` `Private` `Hybrid` `Community` | the five trait names appear here, two sections before TR slide 11 introduces them; the chip marks what this session opens (rule 4) |
| 11 | caption `Management and security run down both sides`; kicker `On-Premise vs Cloud` | the image has neither; the kicker is borrowed from the TR slide whose page carries the image |
| 12 | title `Cost, Scale and Speed`; lead `Organisations adopt cloud computing to reduce infrastructure costs, handle changing demand, and provision resources faster.`; tiles `Before` / `Cloud` ×3; `6` | REV-15's copy (section 1) and the deck's tile labels |
| 15 | `Mine`, `VM` ×3 | picture labels beside the points (`Mine` for the private-computer illusion) |
| 16, 19, 22, 32, 36, 39, 40, 44, 51, 54, 56, 59, 62 | the picture and chart labels listed per slide in section 1 (`Jobs queued` / `Scheduled turns` / `Terminal` / `My computer`; `Client: the desktop` / `Requests` / `Better resource utilization` / `Hardware independence`; `Idle CPUs combined for shared jobs` / `Owned:` / `Consumed:`; `Manager` / `Finance` / `IT desk` / `Week 6` / `Weeks-long procurement ticket` / `Resources provisioned`; `2 slices now` / `A A B B B C` / `EC2 host: many tenants`; `Vertically` / `Horizontally` / `5 of 6 servers in use`; `CloudWatch alarm triggers the Auto Scaling Group` / `Billing 8 instances now`; `In use` / `metered` / `4 metered`; `Yr 1` to `Yr 4` / `Reserved Instances: on` / `Capital kept for the business`; `Load and spend` / `10 Regions` / `Production in days` / `Buying hardware: months` and the capture caption; `Your application` / `Skills in one provider's tools` / `Exit cost` / `Mitigation: off` / `Moving the application` / `Built from one provider’s parts`; `Forgotten, running` / `Monthly bill` / `Budgets alert: abnormal spend`; `A request to` / `Region chosen at creation`) | drawn-scene labels with no TR sentence behind them; the words are the TR bullets' or the deck's own |
| 18 | lead `Clients request services from servers. Virtualization allows one physical server to run multiple isolated virtual machines (VMs), each with its own OS.`; labels `Hypervisor`, `One server` | REV-15's lead (section 1) and two picture labels |
| 10, 12, 16, 22, 24, 32, 34, 36, 40, 42, 51, 59, 62 | `A locked data centre`, `Reachable from anywhere over the internet`, `Cloud Adoption`, `Scheduled turns`, `Institution`, `One grid`, `Adoption`, `Launch Instance`, `HTTPS/API`, `AWS API`, `Tenant A/B/C`, `Demand` / `Instance count` / `Time`, `Instance size`, `CapEx` / `OpEx`, `An unmonitored resource kept billing`, `Data residency zone`, `Nearest Region` / `Distant Region` | lifted from the TR's Visual Guidance lines, which are not content |
| 9, 17, 20, 23, 33, 37, 41, 45, 52, 57, 60 | `SAME IDEA`, one claim line per analogy (`Move in, do not build`, `Everyone gets a scheduled turn`, `One space, divided and locked`, `Pool the load, pay your share`, `Nobody to ask first`, `One stock, portions on demand`, `Stretch, then spring back`, `Billed for what was used`, `Pay for the trip, not the car`, `Fitted things do not move`, `Left on, still charging`), the kicker-title pair `… / Analogy`, and the scene labels listed in section 1 (including 57's `Bolted on`, `Moving out`, `Fitted to this wall` and 52's `Meter: trip 5 of 6`, `Loan, insurance, upkeep`) | the analogy grammar; the TR sentence is in `notes` |
| 21, 25, 29, 47, 49, 53, 55, 58, 61 | the slide title repeated inside the statement card | the `Statement` component (`scene.tsx`) prints the title as the card's heading under the header; no new words |
| 27, 64 | `YOUR TURN`, `Quiz Time!`, and on 27 the timer `00:00` | the quiz frames rule 18 places (the second before the takeaways); their words are the 2026-10-22 quiz rule (generate-slides SKILL.md §2c, reference slide 25 of the virtualization deck), with the timer per 2026-10-23 (27 keeps it, 64 does not). The TR has no quiz frames |
| 66 | `Next Session` | kit kicker (rule 2b) |
| 17, 37 (svg only) | `Kabir`, `Riya`, `Dev`, `Ananya`, `Baker` | the cast rigs' `aria-label`s; not visible text |
| 33, 37, 41, 52, 57 (alt text only) | `A bank ATM set into a wall, its keypad and card slot lit`, `A serving counter, food portioned out of shared trays with tongs`, `A coil of coloured rubber bands resting on a table`, `A yellow taxi moving through a city street, its surroundings blurred`, `A kitchen on moving day: cupboards bolted to the wall, a plant and a lamp going out through the doorway into a moving box on the pavement` | the analogy pictures' `alt` / `aria-label` descriptions; not visible text |
