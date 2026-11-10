# Cloud Computing Fundamentals: deck against the TR doc, slide by slide

**Date:** 2026-10-22

**Inputs**

| | |
|---|---|
| TR doc | `Reference ppt's/1. Cloud Computing Fundamentals.pdf` (17 pages: agenda, 25 TR slides in 5 sections, Key Takeaways, Upcoming Session, Thank You), text extracted to `scratchpad/tr/tr.txt`, plus its two embedded images `img-000.png` (page 3, "Cloud Computing Architecture") and `img-001.png` (page 8, the five traits round a "Cloud") |
| Deck | a frozen copy of `Outputs/cloudcomputing/cloud_computing_fundamentals` (`src/decks/cloudDeck.tsx`, 69 slides; strings in `src/decks/figures/*.tsx`), read from the rendered DOM: Playwright opened `http://127.0.0.1:5271/?all#/N` for N = 1 to 69 and dumped each slide's `section.innerText` plus svg text and `alt`/`aria-label` strings (`scratchpad/parta/dump.mjs`, output `dump.txt`) |
| Rules cited | `.claude/skills/slide-content-rules/SKILL.md` (rule numbers below) and `slide-kit/workflow/TEXT_GUIDELINES.md` (section numbers below); the session's own `CLAUDE.md` and `session_plans/cloud_computing_fundamentals/plan.md` for the recorded review decisions |

**Slide numbering.** The numbers below are the deck's as it stood when the comparison was made (69 slides). In the same pass the feedback slide (67) was deleted on the user's word, so in the current deck `thank-you` is 67 and `all-the-best` is 68; every other number is unchanged. Deck slides are numbered 1 to 69 in the deck's own order (1 brand, 2 welcome, 3 agenda, 4 section 1 divider, 5 why-emerged, 6 nist, 7 nist-points, 8 nist-branches, 9 nist-analogy, 10 onprem-vs-cloud, 11 architecture, 12 drivers, 13 section 2 divider, 14 four-eras, 15 mainframes, 16 mainframes-2, 17 mainframes-analogy, 18 virtualization, 19 virtualization-2, 20 virtualization-analogy, 21 grid-utility, 22 grid-points, 23 grid-analogy, 24 public-cloud, 25 evolution-table, 26 evolution-rows, 27 quiz-mid, 28 section 3 divider, 29 five-traits, 30 five-traits-ring, 31 self-service, 32 self-service-2, 33 self-service-analogy, 34 network-access, 35 pooling, 36 pooling-2, 37 pooling-analogy, 38 section 4 divider, 39 three-overview, 40 elasticity, 41 elasticity-analogy, 42 elasticity-scalability, 43 elasticity-table, 44 measured-service, 45 measured-analogy, 46 section 5 divider, 47 tradeoffs, 48 tradeoffs-map, 49 capex-opex, 50 capex-points, 51 capex-points-2, 52 capex-analogy, 53 growth-speed, 54 growth-points, 55 lock-in, 56 lock-in-points, 57 lock-in-analogy, 58 cost-overruns, 59 overruns-points, 60 overruns-analogy, 61 latency-residency, 62 latency-points, 63 benefit-risk, 64 quiz-close, 65 takeaways, 66 next-session, 67 feedback, 68 thank-you, 69 all-the-best). "TR slide N" is the PDF's own numbering, 1 to 25.

**Summary.** 51 of the 69 deck slides differ from the TR in at least one on-slide string. Twelve of those differ only by a dropped trailing full stop (rule 36). Eleven are analogy slides, where the TR's analogy sentence is on screen as scene labels and a one-line claim, with the sentence itself carried in `notes`. Ten slides carry bullet or lead text that is a different text from the PDF: seven of them (22, 31, 50, 54, 56, 59, 62) hold the bullets of the deck's source build, `Reference ppt's/cloud-computing-fundamentals 1.html`, which the PDF later rewrote (the PDF's stray fragment `pEx to pay-per-use OpEx, cuts idle capacity` on TR slide 4 is the tail of that build's `converts CapEx to pay-per-use OpEx, cuts idle capacity`, so the PDF is the later revision), and three (6, 12, 18) hold copy the 2026-10-15 review supplied word for word. One slide, 34, carries none of its four TR bullets. The rest are splits at a colon into a label and a body, sentence-case capitals, the dropped session number, and kit chrome. After slide 34, 8 pieces of TR content are absent or only partly present (section 2), the largest being TR slide 21's `Business value` bullet. The deck also reproduces both embedded TR images (slides 11 and 30), so the "architecture" slide does have a TR counterpart, as a picture rather than as text (section 3).

Reason codes used below: **R1** rule 1 (spaced em dash banned) · **R36** rule 36 (no full stop at the end of a line; two sentences become two lines) · **R39** rule 39 (the agenda mark says `Agenda`) · **R41** rule 41 (feedback, Thank You, All the Best close every deck) · **R12b** rule 12b "Never print a session number" · **R2b** rule 2b (the `Next Session` kicker is the one permitted session reference) · **R21** rule 21 (the kit `WelcomeSlide` owns the welcome line) · **R24** rule 24 (no unexpanded acronym) · **R26** rule 26 (`via` and other Latin abbreviations banned) · **SC** the 2026-10-16 review's "sentence case on every label" pass (session `CLAUDE.md`; checked by `.text-audit.mjs`) · **REV-15** the 2026-10-15 review, applied on the user's word (plan "Revision 2026-10-15": slide 6 definition replaced, old slides 11 and 16 copy "replaced word for word by the review's") · **REV-16** the 2026-10-16 review (agenda five titles only, title slides show only the title) · **PLAN-1** plan decision 1 (every word of the reference build is kept; the deck was never re-synced to the PDF, which is a later revision) · **PLAN-2** plan decision 2 and the two review splits (one TR slide becomes a statement slide, a points slide, a picture slide and an analogy slide) · **PLAN-4** plan decision 4 (each analogy is a drawn scene labelled with the reference's labels, `SAME IDEA`, then the claim; the TR sentence goes to `notes`) · **SPLIT** a `label: body` bullet rendered as a tile or card title over its body (the figure's own label-and-body shape; no written rule).

---

## 1. Wording changes

One row per changed string, in deck order. Where a TR slide maps to several deck slides, the mapping line says which deck slide carries which TR part. Cells are verbatim; long cells are trimmed to the differing phrase with "…".

### Opening (TR title page and agenda)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 2 | `Session 1 : Cloud Computing Fundamentals` | `Welcome to Today’s Session` / `Cloud Computing Fundamentals` | R12b (no session number on a slide); the kicker is the kit `WelcomeSlide`'s fixed line (R21) |
| 3 | `Agenda for Today's Session` | kicker `Cloud Computing Fundamentals`, title `Agenda` | R39 |
| 3 | `1. Cloud Computing Basics: Definition & the NIST view; on-premise IT vs cloud; drivers: cost, scale & speed` | `1` / `Cloud Computing Basics` | REV-16: "five points, one line each, no sub-points" (deck `notes`, session `CLAUDE.md`). The sub line survives verbatim on slide 65 |
| 3 | `2. History & Evolution: Mainframes & time-sharing; …` | `2` / `History & Evolution` | REV-16, as above |
| 3 | `3. Essential Characteristics - I: On-demand self-service; …` | `3` / `Essential Characteristics - I` | REV-16, as above |
| 3 | `4. Essential Characteristics - II: Rapid elasticity vs scalability; …` | `4` / `Essential Characteristics - II` | REV-16, as above |
| 3 | `5. Benefits & Challenges: Cost model shift, elasticity, …` | `5` / `Benefits & Challenges` | REV-16, as above |
| 4, 13, 28, 38, 46 | `SECTION 1: 1. Cloud Computing Basics` (and sections 2 to 5) | `01` / `Cloud Computing Basics` (and `02`…`05`) | Kit `SectionBreakerSlide`; the subtitle (the agenda sub line) was removed by REV-16 ("title slides show only the title"). Format only, no word changed |

### TR slide 1 (Why Cloud Computing Emerged) → deck 5

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 5 | `…locking capital years before the load actually arrives.` | `…locking capital years before the load actually arrives` | R36 |
| 5 | `On-premise IT: organisation buys, installs, maintains hardware` | `On-premise IT` / `Organisation buys, installs, maintains hardware` | SPLIT (panel title over body; the reference build already split it) + SC (capital O) |
| 5 | `Cloud IT: computing rented as a metered service` | `Cloud IT` / `Computing rented as a metered service` | SPLIT + SC |
| 5 | `Shift driven by cost, scale and speed pressures` | unchanged | |

### TR slide 2 (Defining Cloud Computing Formally) → deck 6 (definition), 7 (four points), 8 (three branches), 9 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 6 | `The National Institute of Standards and Technology (NIST) defines cloud computing as a model for enabling anywhere, convenient, on-demand network access to a shared pool of configurable computing resources (networks, servers, storage, applications, and services) that can be rapidly provisioned and released with minimal management effort or service provider interaction.` | `According to NIST (National Institute of Standards and Technology), cloud computing provides convenient, on-demand network access to shared computing resources (networks, servers, storage, applications, and services) that can be quickly provisioned and released with minimal management effort.` | REV-15 ("Slide 6 definition replaced with the review's NIST wording"). No content rule asks for it. Dropped: `a model for enabling anywhere`, `shared pool of configurable`, `rapidly` (now `quickly`), `or service provider interaction`. The reference build carried the TR sentence verbatim. Note the TR speaker note on this slide says to "state it precisely" as SP 800-145, and this is no longer the SP 800-145 wording. The line also keeps its full stop (R36 not applied to the review's copy) |
| 6 | (visual guidance: central box labelled 'NIST Definition') | label `NIST Definition` | from the TR's visual guidance, not from its content |
| 7 | `Five essential characteristics govern shared resource access .` | `Five essential characteristics govern shared resource access` | R36 (and the TR's stray space before the stop) |
| 7 | `Three service models: IaaS, PaaS, SaaS .` | `Three service models: IaaS, PaaS, SaaS` | R36 |
| 7 | `Four deployment models: public, private, hybrid, community .` | `Four deployment models: public, private, hybrid, community` | R36 |
| 7 | `AWS Management Console exposes this self-service resource catalog .` | `AWS Management Console exposes this self-service resource catalog` | R36 |
| 8 | `Five essential characteristics …` / `Three service models: IaaS, PaaS, SaaS` / `Four deployment models: public, private, hybrid, community` | `Essential Characteristics` / `Five of them` · `Service Models` / `IaaS, PaaS, SaaS` · `Deployment Models` / `Public, private, hybrid, community` | PLAN-2 (the TR visual guidance's three-box tree gets its own slide); SPLIT; SC (`Public`). The leaf chips under each branch and the chip `Opened in this session` have no TR text (section 3) |
| 9 | `Renting a furnished apartment instead of constructing a house gives instant living space without owning bricks or cement — just as cloud computing gives access to configurable computing resources on demand without owning the underlying infrastructure.` | scene labels `A furnished apartment`, `Ready to use`; `SAME IDEA`; `Servers`, `Storage`, `Networks`, `Applications`, `Cloud computing`; claim `Move in, do not build` | PLAN-4. The sentence is in `notes` with `—` turned into a comma (R1). Kicker `Cloud Computing Defined`, title `Analogy` are the deck's |

### TR slide 3 (On-Premise IT vs Cloud) → deck 10 (lead, panels, table) and 11 (the page-3 image)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 10 | `…to a provider, delivered over the network.` | `…to a provider, delivered over the network` | R36 |
| 10 | table, five rows | unchanged (`Organisation owns hardware`, `Provider owns infrastructure`, `Capital expenditure (CapEx)`, `Operating expenditure (OpEx)`, `Weeks to months`, `Minutes`, `Manual hardware upgrade`, `On-demand, software-driven`, `In-house IT team`, `Provider-managed`) | |
| 10 | (visual guidance: "left a locked data-centre building, right a cloud icon reachable from anywhere over the internet") | panel labels `A locked data centre`, `Reachable from anywhere over the internet` | labels lifted from the visual guidance; no TR content text |
| 11 | image `img-000.png`: `Cloud Computing Architecture`, `1 Client Infrastructure`, `Front End`, `9 Internet`, `2 Application`, `3 Service`, `4 Runtime Cloud`, `5 Storage`, `6 Infrastructure`, `7 Management`, `8 Security`, `Back End` | kicker `On-Premise vs Cloud`, title `Cloud Computing Architecture`; all nine numbered labels reproduced; `Front End`/`Back End` rendered as `FRONT END`/`BACK END` (literal capitals in `basics.tsx:279`); caption `Management and security run down both sides` added | The image is reproduced as a drawn figure (plan slide 10 `ArchitectureWalk`). The capitals have no rule behind them and sit against the SC pass; the caption is the deck's own. See section 3 |

### TR slide 4 (Cost Scale and Speed Drivers) → deck 12

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 12 | subheading `Cost Scale Speed` | `Cost, Scale and Speed` | REV-15 (old slide 11, "copy replaced word for word by the review's") |
| 12 | `Three pressures push organisations toward cloud: unpredictable cost of owning hardware, difficulty scaling for sudden demand, and slow speed of provisioning new infrastructure.` | `Organisations adopt cloud computing to reduce infrastructure costs, handle changing demand, and provision resources faster.` | REV-15; keeps its full stop (R36 not applied) |
| 12 | `Cost: Pay for what you use instead of maintaining unused hardware.` and the stray line `pEx to pay-per-use OpEx, cuts idle capacity` | `Cost:` / `Pay only for the resources used (OpEx instead of upfront CapEx).` | REV-15; the PDF's two lines are folded into one; full stop kept |
| 12 | `Scale: resources added or removed as demand shifts` | `Scale:` / `Add or remove resources based on demand.` | REV-15; full stop added |
| 12 | `Speed: servers provisioned in minutes, not procurement cycles` | `Speed:` / `Provision servers in minutes instead of waiting for hardware procurement.` | REV-15; full stop added |
| 12 | `Reflected in tools like AWS Cost Explorer, Pricing Calculator` | `AWS Tools: Cost Explorer and Pricing Calculator help monitor and estimate costs.` | REV-15; full stop added |
| 12 | (visual guidance: arrow marked 'Cloud Adoption') | `Cloud Adoption`; tiles `Before` / `Cloud` ×3 | the bar label is the visual guidance's; the tile labels are the deck's (section 3) |

### TR slide 5 (Four Eras of Computing Evolution) → deck 14

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 14 | `…each solving the resource-sharing problem of its own time.` | `…each solving the resource-sharing problem of its own time` | R36 |
| 14 | `1960s-70s: mainframes & time-sharing` | `1960s-70s` / `Mainframes & time-sharing` | SPLIT (period over label) + SC (the reference build had `mainframes` lowercase) |
| 14 | `1980s-2000s: client-server & x86 virtualization` | `1980s-2000s` / `Client-server & x86 virtualization` | SPLIT + SC |
| 14 | `1990s-2000s: grid & utility computing` | `1990s-2000s` / `Grid & utility computing` | SPLIT + SC |
| 14 | `2006 onward: the public cloud era` | `2006 onward` / `The public cloud era` | SPLIT + SC |

### TR slide 6 (Mainframes and the Rise of Time-Sharing) → deck 15 (lead and points), 16 (picture), 17 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 15 | `…let many users access the same machine at once.` | `…let many users access the same machine at once` | R36 |
| 15 | bullets 1 to 4 | unchanged (`Mainframes: centralised, costly machines run by dedicated operators` · `Batch processing: jobs queued and run without interaction` · `Time-sharing (1960s): CPU scheduled across simultaneous terminal users` · `Each user experienced an illusion of a private computer`) | |
| 15 | `IBM's CP-40/CP-67 (1960s) pioneered mainframe virtualization — the earliest form of the concept` | `IBM's CP-40/CP-67 (1960s) pioneered mainframe virtualization: the earliest form of the concept` | R1 (already a colon in the reference build) |
| 16 | (visual guidance: mainframe box, terminal lines, a clock marking scheduled turns) | `Jobs queued`, `Scheduled turns`, `Mainframe`, `CPU scheduled across simultaneous terminal users`, `CP-40/CP-67`, `VM` ×3, `Terminal` / `My computer` ×4 | PLAN-2 (the picture is its own slide, split 2026-10-16); labels are the TR bullets' words rearranged (`My computer` for `illusion of a private computer`). No TR sentence changed |
| 17 | `A library reading room with one shared encyclopedia set, where each reader gets a scheduled turn at the desk — just as time-sharing gave every terminal user a scheduled turn on one mainframe.` | `A library reading room`, `Turn 1` to `Turn 4`; `SAME IDEA`; `Time-sharing`, `Turn 1` to `Turn 4`; claim `Everyone gets a scheduled turn` | PLAN-4. `one shared encyclopedia set` is drawn, not labelled. Sentence in `notes`, `—` to a comma (R1) |

### TR slide 7 (Client-Server Shift and Virtualization) → deck 18 (lead and points), 19 (picture), 20 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 18 | `Personal computers and networks split work into client requests and dedicated servers; virtualization then let one physical server run several independent virtual machines — self-contained, software-based "computers" that each run their own OS .` | `Clients request services from servers. Virtualization allows one physical server to run multiple isolated virtual machines (VMs), each with its own OS.` | REV-15 (old slide 16, "copy replaced word for word by the review's"). Two sentences on one line with full stops (R36 not applied) |
| 18 | `1980s-90s: client-server split desktop and network-server roles` and the TR's second block `1980s–90s: Client computers sent requests to dedicated servers.` | `1980s–90s: Clients accessed shared server resources.` | REV-15 |
| 18 | `Commodity x86 virtualization (late 1990s onward, e.g. VMware): a hypervisor — the software layer that creates and manages VMs — partitions one server` | `Late 1990s onward: Hypervisors enabled multiple VMs on one server.` | REV-15. The hypervisor gloss (`the software layer that creates and manages VMs`), `Commodity x86` and `VMware` have no on-slide counterpart; `Hypervisor` appears as a bare label on 18, 19 and 20 |
| 18 | `Each virtual machine runs its own OS, isolated from others` · `Decouples software from physical hardware, enabling resource pooling` | `Benefit: Better resource utilization and hardware independence.` | REV-15. `its own OS` and `Isolated virtual machines` survive as picture labels on 19; `enabling resource pooling` has no counterpart. US spelling `utilization` against the TR's `organisation`, `centralised` |
| 18 | `Clients: Computers used by people to access applications and services.` · `Servers: Computers designed to provide data, applications, or services to other computers.` · `This allowed many clients to use shared resources from dedicated servers.` · `Next: As the number of servers grew, a new idea emerged — virtualization, which helped use physical servers more efficiently.` | no counterpart | REV-15 copy does not carry the TR's client/server definitions (this block is also absent from the reference build, so it is a PDF addition the deck never saw) |
| 19 | (visual guidance: server box, hypervisor layer, three VM boxes with an OS icon) | `Client: the desktop`, `Requests`, `VM` / `Its own OS` ×3, `Hypervisor`, `One physical server`, `Isolated virtual machines`, `Better resource utilization`, `Hardware independence` | PLAN-2 picture slide; labels only |
| 20 | `One large plot subdivided into separate, locked apartments by a building's structure — just as a hypervisor partitions one physical server into isolated virtual machines, each unaware of its neighbours.` | `One plot`, `1` `2` `3`, `One plot, locked apartments`; `SAME IDEA`; `VM` / `Its own OS` ×3, `Hypervisor`, `One physical server`, `Virtual machines`; claim `One space, divided and locked` | PLAN-4. `by a building's structure` and `each unaware of its neighbours` are drawn, not labelled |

### TR slide 8 (Grid Computing and Utility Computing) → deck 21 (lead), 22 (points and picture), 23 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 21 | `…billing that powers the way electricity is billed.` | `…billing that powers the way electricity is billed` | R36 (the TR's own odd phrase is kept as is) |
| 22 | `Grid computing:Combines unused processing power from many computers for large tasks.` | `Grid computing: idle CPUs across institutions combined for shared jobs` | PLAN-1: the reference build's bullet; the PDF rewrote it. No rule |
| 22 | `Example : Scientific projects use processing power from many participating computers.` | `Example: distributed scientific projects pooling volunteer processing power` | PLAN-1, as above |
| 22 | `Utility computing: Pay for the computing capacity you actually use, rather than owning it.` | `Utility computing: pay only for capacity consumed, not owned` | PLAN-1, as above |
| 22 | `Key idea: Both concepts separate resource usage from hardware ownership, paving the way for cloud computing.` | `Both separate consumption from ownership of hardware, ahead of cloud` | PLAN-1, as above (`Key idea:` label dropped) |
| 22 | (visual guidance: institution icons linked into one grid; a metering gauge beside it) | `Institution` ×3, `One grid`, `Idle CPUs combined for shared jobs`, `Metered billing`, `Owned: stays with each institution`, `Consumed: paid by use` | picture labels; `Owned:`/`Consumed:` are the deck's |
| 23 | `Several small businesses sharing one shipping company's trucks, pooling partial loads and paying only for the weight each one ships — just as grid computing pools spare processing power and utility computing bills only for capacity consumed.` | `2 kg`, `5 kg`, `3 kg`, `Pay by weight`, `One shipping company's trucks`; `SAME IDEA`; `Pooled processing power`, `Metered billing`, `Grid and utility computing`; claim `Pool the load, pay your share` | PLAN-4 |

### TR slide 9 (The Public Cloud Era Begins) → deck 24

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 24 | `…directly over the internet, on demand.` | `…directly over the internet, on demand` | R36 |
| 24 | `2006: Amazon Web Services launches S3 storage, then EC2 compute` (and 2008, 2010) | `2006` / `Amazon Web Services launches S3 storage, then EC2 compute` (and 2008, 2010 likewise) | SPLIT (year over label) |
| 24 | `By the 2010s: public cloud becomes the default for new IT` | `By the 2010s` / `Public cloud becomes the default for new IT` | SPLIT + SC |
| 24 | (visual guidance: a rising adoption curve) | `Adoption` | curve label from the visual guidance |

### TR slide 10 (Evolution Timeline and Legacy Summary) → deck 25 (lead), 26 (table)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 25 | `…to metered, on-demand delivery over the internet.` | `…to metered, on-demand delivery over the internet` | R36 |
| 26 | table, four rows | unchanged; the ribbon `1960s-70s` `1980s-2000s` `1990s-2000s` `2006 onward` above it is the visual guidance's "slim timeline ribbon" | |

### TR slide 11 (NIST Essential Characteristics) → deck 29 (lead), 30 (ring and the five glosses)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 29 | `…that distinguishes cloud from traditional IT.` | `…that distinguishes cloud from traditional IT` | R36 |
| 30 | five bullets | unchanged, as the rail beside the ring | |
| 30 | image `img-001.png`: `On-Demand Self-Service`, `Broad Network Access`, `Resource Pooling`, `Rapid Elasticity`, `Measured Service` round the word `Cloud` | the five boxes reproduced in the image's Title Case; the centre holds a small picture of the lit trait instead of the word `Cloud` | the image is reproduced (`TraitRing`); its one word, `Cloud`, is not on the slide. See section 3 |

### TR slide 12 (On-Demand Self-Service Explained) → deck 31 (lead and points), 32 (picture), 33 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 31 | `…without requiring a phone call or ticket to the provider's staff.` | `…without requiring a phone call or ticket to the provider's staff` | R36 |
| 31 | `Choose the resources you need using a cloud console, command, or API` | `Customer requests via console, CLI or API` | PLAN-1: the reference build's bullet; the PDF rewrote it. The deck line uses `via`, which R26 bans; the PDF's line does not |
| 31 | `No need to wait for IT staff or lengthy hardware-procurement processes` | `Contrasts with traditional IT: weeks-long procurement tickets` | PLAN-1, as above |
| 31 | `For example, AWS lets you launch a virtual server (EC2) with a few clicks` | `AWS: EC2 'Launch Instance' or CLI run-instances call` | PLAN-1, as above |
| 32 | (visual guidance: Launch Instance highlighted, no approval step between) | `Manager`, `Finance`, `IT desk`, `Week 6`, `Weeks-long procurement ticket`, `Console`, `CLI`, `API`, `EC2`, `Launch Instance`, `Resources provisioned`, `Without human intervention` | PLAN-2 picture slide; labels only. `Without human intervention` is the TR subheading reused |
| 33 | `An ATM lets a customer withdraw cash any time, without a bank clerk approving each transaction — just as on-demand self-service lets a customer provision cloud resources instantly without provider staff involvement.` | `Cash out`, `No queue, no clerk`, `An ATM`; `SAME IDEA`; `Launch Instance`, `Ready`, `Nobody to ask first`, `On-demand self-service`; claim `Nobody to ask first` | PLAN-4 (`Nobody to ask first` appears twice: scene label and claim) |

### TR slide 13 (Broad Network Access) → deck 34

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 34 | `…from heterogeneous client devices, laptops, phones or thin clients alike.` | `…from heterogeneous client devices, laptops, phones or thin clients alike` | R36 |
| 34 | `Uses standard protocols: HTTPS APIs, SDKs, browser console` · `Same service reachable from laptop, mobile app, CLI` · `No proprietary client software required, unlike legacy systems` · `AWS: identical API reachable via Console, CLI, SDK, mobile app` | **none of the four bullets is on the slide.** The slide holds the lead and the device ring only: `AWS API`, `Laptop`, `Mobile app`, `Browser console`, `CLI`, `HTTPS/API` ×4 | No rule. The reference build drew this slide as the visual guidance's figure (hub `AWS API`, four spokes) with no points, and the deck inherited that. `SDK`, `No proprietary client software`, `legacy systems` and `identical API` appear nowhere in the deck. The only gloss on screen for this trait is slide 30's `Broad network access: reachable over standard protocols` |

### TR slide 14 (Resource Pooling & Multi-Tenancy) → deck 35 (lead and points), 36 (picture), 37 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 35 | `…assigned dynamically rather than dedicated per customer.` | `…assigned dynamically rather than dedicated per customer` | R36 |
| 35 | four bullets | unchanged (`Multi-tenancy: multiple customers share same physical hardware` · `Hypervisor: virtualization software splitting one server into isolated tenants` · `Location independence: customer unaware of physical resource` · `AWS: EC2 hosts run multiple tenants via shared hypervisor`; the `via` is the TR's own) | |
| 36 | (visual guidance: one server, a hypervisor layer, tenants A, B, C drawing slices) | `Tenant A` / `2 slices now`, `Tenant B` / `3 slices now`, `Tenant C` / `1 slice now`, `A A B B B C`, `Hypervisor`, `Shared physical hardware`, `EC2 host: many tenants` | PLAN-2 picture slide; labels only |
| 37 | `A hostel mess kitchen serves many students from one shared stock of vessels, portioning food on demand instead of giving each student a dedicated stove — exactly as resource pooling shares infrastructure dynamically across tenants.` | `No stove per student`, `A hostel mess kitchen`; `SAME IDEA`; `One shared pool`, `Resource pooling`; claim `One stock, portions on demand` | PLAN-4. Sentence in `notes`, `— exactly as` to `, exactly as` (R1) |

### TR slide 15 (Elasticity Scalability And Measured Service) → deck 39

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 39 | `Cloud platforms must absorb changing demand and charge only for what gets used. Three characteristics make that possible: rapid elasticity, scalability, and measured service.` | `Cloud platforms must absorb changing demand and charge only for what gets used` / `Three characteristics make that possible: rapid elasticity, scalability, and measured service` | R36 (two sentences become two lines, no stops) |
| 39 | `Rapid elasticity: automatic scale-out and scale-in with demand` | `Rapid elasticity` / `Automatic scale-out and scale-in with demand` | SPLIT + SC |
| 39 | `Scalability: capacity to grow, vertically or horizontally` | `Scalability` / `Capacity to grow, vertically or horizontally` (+ picture labels `Vertically`, `Horizontally`) | SPLIT + SC |
| 39 | `Measured service: usage tracked and billed per resource consumed` | `Measured service` / `Usage tracked and billed per resource consumed` | SPLIT + SC |

### TR slide 16 (Rapid Elasticity Explained) → deck 40 (lead, points, chart), 41 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 40 | `…as demand rises or falls.` | `…as demand rises or falls` (the TR's spaced hyphen in `resources - in most cases` is kept; it is a hyphen, not an em dash) | R36 |
| 40 | four bullets | unchanged | |
| 40 | (visual guidance: traffic spike, instance-count line, an Auto Scaling Group icon) | `Demand`, `Instance count`, `CloudWatch alarm`, `Time`, `CloudWatch alarm triggers the Auto Scaling Group`, `Billing 8 instances now` | chart labels; the marker sentence is the reference build's |
| 41 | `A rubber band stretches under load and springs back once released — just as auto-scaled capacity expands during a spike and contracts once demand fades.` | `Stretched under load`, `A rubber band`; `SAME IDEA`; `6 instances`, `Rapid elasticity`; claim `Stretch, then spring back` | PLAN-4 |

### TR slide 17 (Elasticity Vs Scalability Compared) → deck 42 (lead and chart), 43 (table)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 42 | `…can absorb growth at all.` | `…can absorb growth at all` | R36 |
| 42 | (visual guidance: side-by-side chart, instance count against a step-change resize) | `Elasticity` / `Instance count`, `Scalability` / `Instance size` | chart labels only; the table moved to 43 (REV-15: "34 splits chart / table") |
| 43 | table | unchanged (`Scales out and back  in` loses the TR's double space) | |

### TR slide 18 (Measured Service And Metering) → deck 44 (lead, points, dials), 45 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 44 | `…so bills map directly to actual consumption.` | `…so bills map directly to actual consumption` | R36 |
| 44 | `No usage recorded means no charge — true pay-per-use pricing` | `No usage recorded means no charge: true pay-per-use pricing` | R1 (already a colon in the reference build) |
| 44 | bullets 1 to 3 | unchanged | |
| 44 | (visual guidance: meter feeding a billing dashboard, per-second, per-GB, per-request tags) | `Compute-seconds` / `In use` (×4 metrics), `CloudWatch`, `Billing and Cost Explorer`, `metered` ×4, `EC2 per-second`, `S3 per-GB-month`, `Lambda per-request`, `4 metered` | dial and bill labels, the bullets' words reused |
| 45 | `A household electricity meter records exactly how many units are consumed, and the bill reflects only that usage — just as cloud providers meter every compute-second and byte served, billing only for actual use.` | `2 on, the meter turns`, `A household electricity meter`; `SAME IDEA`; `2 running, 2 billed`, `Measured service`; claim `Billed for what was used` | PLAN-4 |

### TR slide 19 (Cloud Benefits And Challenges Overview) → deck 47 (lead), 48 (scale and the eight cells)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 47 | `…separates sound architecture decisions from costly surprises.` | `…separates sound architecture decisions from costly surprises` | R36 |
| 48 | column headings `Benefits` / `Challenges` | `BENEFITS` / `CHALLENGES` | no rule found; literal capitals in `benefits.tsx:74` (the scale's pan labels), against the SC pass. The reference build had `Benefits` / `Challenges` |
| 48 | eight cells | unchanged (`Cost model shift (CapEx→OpEx)`, `Vendor lock-in`, `Elasticity of resources`, `Cost overruns`, `Global reach`, `Latency`, `Speed to market`, `Data residency`) | |

### TR slide 20 (Cost Model Shift From CapEx To OpEx) → deck 49 (lead), 50 (points), 51 (graph), 52 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 49 | `On-premise IT demands large upfront capital expenditure on hardware before any workload runs. Cloud shifts most of that spend to metered operating expenditure, billed for resources as they're consumed.` | `On-premise IT demands large upfront capital expenditure on hardware before any workload runs` / `Cloud shifts most of that spend to metered operating expenditure, billed for resources as they're consumed` | R36 (two lines, no stops) |
| 50 | `No upfront hardware: Avoid large hardware purchases and depreciation costs.` | `No upfront hardware purchase or depreciation schedule` | PLAN-1: the reference build's bullet; the PDF rewrote it into a labelled sentence. No rule |
| 50 | `Usage-based spending: Costs increase or decrease with resource usage.` and `Reserved Instances: Commit to usage for a lower price, with less flexibility.` | one line: `Spend scales largely with actual resource usage (committed-use options like Reserved Instances trade some flexibility for lower rates)` | PLAN-1; the PDF gives Reserved Instances its own bullet, the deck keeps it inside a parenthesis (see section 2) |
| 50 | `Business benefit: Free up capital for other business needs.` | `Frees capital for core business investment` | PLAN-1 |
| 50 | `Cost tracking: AWS Cost Explorer and Billing Dashboard help monitor spending.` | `AWS Cost Explorer and Billing Dashboard track OpEx spend` | PLAN-1 |
| 51 | (visual guidance: a tall one-time CapEx spike against a flat recurring OpEx line) | `CapEx` / `Yr 1` to `Yr 4`, `OpEx` / `Yr 1` to `Yr 4`, `Reserved Instances: off`, `Capital kept for the business`, `Cost Explorer` | PLAN-2 picture slide (split 2026-10-16); labels only |
| 52 | `Renting a taxi for occasional trips avoids buying and maintaining a car that sits idle most days — exactly as OpEx cloud billing avoids owning hardware capacity that sits unused.` | `Meter: trip 5 of 6`, `Owned car, idle most days`, `Loan, insurance, upkeep`, `Renting a taxi`; `SAME IDEA`; `Trip 1` to `Trip 6`, `Pay per use, nothing between trips`, `OpEx cloud billing`; claim `Pay for the trip, not the car` | PLAN-4 |

### TR slide 21 (Elasticity, Global Reach And Speed To Market) → deck 53 (lead), 54 (points and picture)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 53 | `…worldwide presence and lower idle spend.` | `…worldwide presence and lower idle spend` | R36 |
| 54 | `Elasticity: Automatically scale resources up or down as demand changes.` | `Elasticity: autoscaling matches spend to real-time load` | PLAN-1: the reference build's bullet; the PDF rewrote it |
| 54 | `Global reach: Deploy applications across AWS Regions worldwide.` | `Global reach: new AWS Region live in minutes` | PLAN-1 (`worldwide` survives only in the capture's caption) |
| 54 | `Speed to market: Launch applications and services faster.` | `Speed to market: idea to production in days` | PLAN-1 |
| 54 | `Business value: Scale easily, reach more users, and reduce idle costs.` | no counterpart | absent; section 2 |
| 54 | `Real-world: AWS Auto Scaling groups, Global Infrastructure Region map` | unchanged | |
| 54 | (visual guidance: Region markers lighting up, an autoscaling curve) | `Load and spend`, `Load`, `Spend`, `10 Regions`, `Production in days`, `Buying hardware: months`, caption `The AWS Global Infrastructure page, showing Regions worldwide` | picture labels; the capture is real (plan decision 7) |

### TR slide 22 (Vendor Lock-In And Switching Costs) → deck 55 (lead), 56 (points and picture), 57 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 55 | `…makes moving a workload elsewhere slow, risky and expensive.` | `…makes moving a workload elsewhere slow, risky and expensive` | R36 |
| 56 | `Proprietary services : Services like Lambda and DynamoDB can make applications harder to move.` | `Proprietary services (Lambda triggers, DynamoDB APIs) resist portability` | PLAN-1: the reference build's bullet; the PDF rewrote it into plain words |
| 56 | `Data egress fees: Moving data out of a provider can add extra costs.` | `Data egress fees add direct exit cost` | PLAN-1 |
| 56 | `Specialized skills: Teams may become dependent on one provider's tools.` | `Team skill-set built around one provider's tools` | PLAN-1 |
| 56 | `Mitigation: Use multi-cloud, open standards, and Infrastructure as Code (IaC)` | `Mitigation: multi-cloud design, open standards, Infrastructure as Code` | PLAN-1; `(IaC)` dropped (section 2) |
| 56 | (visual guidance: an application boxed inside one provider, a padlock toward other providers) | `ONE PROVIDER`, `Your application`, `Lambda triggers`, `DynamoDB APIs`, `Skills in one provider's tools`, `Data egress fees`, `Exit cost`, `Other providers`, `Mitigation: off`, `Moving the application`, `Built from one provider’s parts` | picture labels; `ONE PROVIDER` is literal capitals (`benefits.tsx:381`), against the SC pass |
| 57 | `A rented apartment fitted with the landlord's custom cupboards works only in that apartment — just as an application built entirely on one cloud's proprietary APIs runs only on that cloud.` | `Moving out`, `Fitted to this wall`, `A landlord's fitted cupboards`; `SAME IDEA`; `One provider`, `Your application`, `Lambda triggers`, `DynamoDB APIs`, `Other providers`, `Built from one provider's parts`, `Vendor lock-in`; claim `Fitted things do not move` | PLAN-4 |

### TR slide 23 (Cost Overruns In Pay-Per-Use Billing) → deck 58 (lead), 59 (points and picture), 60 (analogy)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 58 | `…can turn into a large, unexpected bill.` | `…can turn into a large, unexpected bill` | R36 |
| 59 | `Unused resources: Resources left running continue to generate charges.` | `Idle or forgotten resources keep billing after use` | PLAN-1: the reference build's bullet; the PDF rewrote it |
| 59 | `Autoscaling: Incorrect settings can increase costs unexpectedly.` | `Misconfigured autoscaling can multiply costs unexpectedly` | PLAN-1 |
| 59 | `Extra charges: Data transfer and API usage can add up quickly.` | `Data transfer and API charges accumulate unnoticed` | PLAN-1 |
| 59 | `Cost control: AWS Budgets and Cost Anomaly Detection help identify unusual spending.` | `AWS Budgets and Cost Anomaly Detection flag abnormal spend` | PLAN-1 |
| 59 | (visual guidance: a climbing bill with a red spike where an unmonitored resource kept running) | `Resources`, `Forgotten, running`, `Data transfer`, `API calls`, `Monthly bill`, `An unmonitored resource kept billing`, `Budgets alert: abnormal spend` | picture labels, the first from the visual guidance |
| 60 | `Leaving international roaming switched on during travel racks up charges unnoticed until the bill arrives — just as unmonitored cloud resources keep billing until the invoice reveals the overrun.` | `Roaming: on`, `Charges grow overnight`, `Roaming left switched on`; `SAME IDEA`; `Forgotten, still running`, `Billing until the invoice`, `Cost overruns`; claim `Left on, still charging` | PLAN-4 |

### TR slide 24 (Latency And Data Residency Challenges) → deck 61 (lead), 62 (points and map)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 61 | `…regardless of which Region is closest.` | `…regardless of which Region is closest` | R36 |
| 62 | `Latency: Choose a nearby AWS Region or CDN edge location to reduce network delay.` | `Mitigation: nearest Region or a CDN edge location` | PLAN-1: the reference build's bullet; the PDF rewrote it. The label `Latency:` becomes `Mitigation:`, so the word latency is on this slide only in the title |
| 62 | `Data residency: Laws and regulations may require certain data to stay within a country.` | `Data residency: laws such as GDPR require in-country storage` | PLAN-1. `GDPR` is the deck's addition, not in the TR, and never expanded (R24) |
| 62 | `Region selection: Choose the appropriate AWS Region to meet data residency requirements.` | `AWS Region selection at creation enforces residency choice` | PLAN-1 |
| 62 | (visual guidance: user, distant Region, nearby Region, a border marking a residency zone) | `Data residency zone`, `User`, `Nearest Region`, `Distant Region`, `Less delay`, `More delay`, `A request to`, `Region chosen at creation` | map labels |

### TR slide 25 (Pairing Cloud Benefits With Their Risks) → deck 63

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 63 | `…is what a sound migration decision requires.` | `…is what a sound migration decision requires` | R36 |
| 63 | table | unchanged (`Benefit Driving Adoption` / `Matching Risk To Manage`, three rows; `Vendor lock-in via managed services` is the TR's own `via`) | |

### Closing (TR Key Takeaways, Upcoming Session, Thank You)

| Slide # | TR doc text | Deck text | Reason for change |
|---|---|---|---|
| 65 | `Key Takeaways` and the five numbered items with their sub lines | unchanged, word for word, including the sub lines the agenda dropped | rule 20 |
| 66 | `Upcoming Session : Deployment & Service Models` | `Next Session` / `Deployment & Service Models` | kit `NextSessionSlide` (fixed kicker); R2b names `Next Session` as the permitted closing kicker; plan decision 10 |
| 68, 69 | `Thank You \| All the Best` | `Thank You` (68) and `All the Best` (69), two frames | R41 |

---

## 2. Missing content, deck slides 35 to 69 (TR slide 14 onward, sections 3 to 5 and the closing)

Speaker notes and Visual Guidance lines are not on-slide content and are not listed. Analogy sentences count as on-slide content; a clause is listed only when no label on the analogy slide carries it.

| TR doc section | Missing content | Suggested slide position |
|---|---|---|
| Section 5, TR slide 21 (Growth And Speed Benefits) | the bullet `Business value: Scale easily, reach more users, and reduce idle costs.` has no counterpart anywhere in the deck (the reference build never had it either) | on deck slide 54, as the fourth point, before `Real-world: …` |
| Section 5, TR slide 20 (Cost Model Shift) | `Reserved Instances: Commit to usage for a lower price, with less flexibility.` is a bullet of its own in the TR; on the deck it exists only inside the parenthesis of slide 50's second line (`committed-use options like Reserved Instances trade some flexibility for lower rates`), while slide 51 draws a `Reserved Instances: off` switch with nothing on that slide saying what it is | on deck slide 50 as its own line, or on deck slide 51 as a caption beside the switch |
| Section 5, TR slide 22 (Vendor Lock-In) | the acronym `(IaC)` after `Infrastructure as Code` | on deck slide 56, bullet 4 (the TR expands it in place, which rule 24 asks for) |
| Section 5, TR slide 24 (Latency And Residency) | the TR's bullet label `Latency:` and its purpose clause `to reduce network delay`; the deck relabels the line `Mitigation:` and the only delay wording is the map's `Less delay` / `More delay` | on deck slide 62, bullet 1 (`Latency: nearest Region or a CDN edge location reduces network delay`) |
| Section 3, TR slide 14 analogy (hostel mess kitchen) | the clause `shares infrastructure dynamically across tenants` has no label; the slide's cloud side says only `One shared pool` and `Resource pooling` | on deck slide 37, under the claim |
| Section 4, TR slide 18 analogy (electricity meter) | the clause `cloud providers meter every compute-second and byte served` has no label; the cloud side says `2 running, 2 billed` | on deck slide 45, under the claim |
| Section 5, TR slide 20 analogy (taxi) | the clause `owning hardware capacity that sits unused` has no label; the cloud side says `OpEx cloud billing` and `Pay per use, nothing between trips` | on deck slide 52, under the claim |
| Section 5, TR slide 23 analogy (roaming) | `international` and `during travel` have no label (`Roaming left switched on`, `Charges grow overnight`) | on deck slide 60, in the scene label |

Nothing else in TR slides 14 to 25, Key Takeaways, Upcoming Session or Thank You is absent: every other bullet, table cell and lead is on the deck, either verbatim or in the reworded form listed in section 1.

**Speaker notes.** No TR speaker note is dropped entirely. Ten notes lose their second sentence (the "interview angle" line) when the TR slide is split across deck slides or the note is trimmed: TR slides 12 (`On-demand self-service removes that human approval step entirely.`), 14 (`This isolation is what makes multi-tenancy safe …`), 15 (`Interviewers often ask for a precise definition of each term …`), 16 (`Interviewers often ask how elasticity differs from simply adding more servers.`), 18 (`Interviews often ask how pay-per-use differs from fixed licensing.`), 20 (`A common interview question asks to explain CapEx versus OpEx …`), 21 (`Interviewers may ask how elasticity concretely shortens time-to-market.`), 22 (`Interviewers often probe how open standards or multi-cloud design mitigate it.`), 23 (`A frequent interview question asks how to prevent cloud bill shock in production.`), 24 (`though both push toward the same Region-selection decision. Interviewers may ask why …`). The analogy sentences are all in `notes` verbatim except for the em dash (R1).

**For completeness, the largest drops before slide 35** (outside this section's scope, listed so the reader has the whole picture): deck slide 34 carries none of TR slide 13's four bullets (`Uses standard protocols: HTTPS APIs, SDKs, browser console`, `Same service reachable from laptop, mobile app, CLI`, `No proprietary client software required, unlike legacy systems`, `AWS: identical API reachable via Console, CLI, SDK, mobile app`); deck slide 18 carries none of TR slide 7's hypervisor gloss (`the software layer that creates and manages VMs`), `Commodity x86 … e.g. VMware`, `Decouples software from physical hardware, enabling resource pooling`, or the `Clients:` / `Servers:` / `This allowed many clients …` / `Next: …` block; deck slide 6's definition drops `a model for enabling anywhere`, `shared pool of configurable` and `or service provider interaction`; deck slide 12's bullets are the review's, so the TR's `not procurement cycles` and `Reflected in tools like …` phrasings are gone.

---

## 3. Deck content not in the TR doc

| Deck slide(s) | Content | Note |
|---|---|---|
| 1 | `Welcome!` | kit `BrandSlide` greeting (rule 21); the TR has no brand frame |
| 2 | `Welcome to Today’s Session` | kit `WelcomeSlide` kicker (rule 21) |
| 4, 13, 28, 38, 46 | `01` to `05` | kit divider numerals |
| 5 | `6 servers bought on a guess`, `4 paid, idle`, `Short by 0: order more, wait weeks`, `6`, `2 billed`, `Demand` | the demand-loop picture's labels (the slide 5 render, session `CLAUDE.md`); `Short by 0` is the held state at demand 0.25 on harness URLs and changes on a live frame |
| 8 | `Five of them`, `Opened in this session`, and the leaf chips `On-demand self-service` … `Measured service`, `IaaS` `PaaS` `SaaS`, `Public` `Private` `Hybrid` `Community` | the five trait names appear here, two sections before TR slide 11 introduces them; the chip marks what this session opens (rule 4) |
| 11 | the whole slide | **reproduces TR image `img-000.png` (PDF page 3, beside TR slide 3): "Cloud Computing Architecture" with the nine numbered boxes.** So it has a TR counterpart as a picture, not as text. Deck additions: caption `Management and security run down both sides`; `FRONT END` / `BACK END` in capitals where the image has `Front End` / `Back End`; kicker `On-Premise vs Cloud` |
| 30 | the ring | **reproduces TR image `img-001.png` (PDF page 8, on TR slide 11):** five Title Case boxes round a centre. The image's centre word `Cloud` is replaced by a small picture of the lit trait; nothing on the slide says `Cloud` |
| 27, 64 | `QUIZ TIME`, `Classroom Quiz`, `Time to check what you have learned so far`, `1 Open the quiz on your portal`, `2 Answer every question on your own`, `3 We go through the answers together`, `Quiz`, `Timer`, `A` `B` `C` `D`, `Submit` | kit `ClassroomQuiz` (plan decision 9, rule 18); the TR has no quiz frames |
| 67 | `Feedback`, `We’d love your feedback`, `Your thoughts help us improve this course`, `Scan to open the feedback form`, `forms.gle/5d1Ru8geTKdC4Bcr7`, `Scan the code, click the link, or fill out the form right here` | kit `FeedbackSlide` (rule 41) |
| 66 | `Next Session` | kit kicker (rule 2b) |
| 9, 17, 20, 23, 33, 37, 41, 45, 52, 57, 60 | `SAME IDEA` and one claim line per analogy (`Move in, do not build`, `Everyone gets a scheduled turn`, `One space, divided and locked`, `Pool the load, pay your share`, `Nobody to ask first`, `One stock, portions on demand`, `Stretch, then spring back`, `Billed for what was used`, `Pay for the trip, not the car`, `Fitted things do not move`, `Left on, still charging`), plus the scene labels listed in section 1 | the analogy grammar (plan decision 4); the claims and most labels are the reference build's, the scene labels added 2026-10-15/16 are the deck's |
| 21, 25, 29, 47, 49, 53, 55, 58, 61 | the slide title repeated inside the statement card | the `Statement` component (`scene.tsx`) prints the title as the card's heading under the header; no new words |
| 12, 16, 19, 22, 32, 36, 39, 40, 44, 51, 54, 56, 59, 62 | picture and chart labels listed per slide in section 1 (`Before` / `Cloud` tiles, `Terminal` / `My computer`, `Client: the desktop`, `Owned:` / `Consumed:`, `Manager` / `Finance` / `IT desk` / `Week 6`, `2 slices now`, `Vertically` / `Horizontally` / `5 of 6 servers in use`, `Billing 8 instances now`, `In use` / `metered` / `4 metered`, `Yr 1` to `Yr 4` / `Reserved Instances: off` / `Capital kept for the business`, `Load and spend` / `10 Regions` / `Buying hardware: months`, `Mitigation: off` / `Moving the application` / `Exit cost`, `Forgotten, running` / `Budgets alert: abnormal spend`, `A request to` / `Region chosen at creation`) | drawn-scene labels with no TR sentence behind them; the words are the TR bullets' or the visual guidance's |
| 62 | `GDPR` | not in the TR; unexpanded (rule 24) |
| 10, 12, 24, 34, 59, 62 | `A locked data centre`, `Reachable from anywhere over the internet`, `Cloud Adoption`, `Adoption`, `HTTPS/API`, `An unmonitored resource kept billing`, `Data residency zone` | lifted from the TR's Visual Guidance lines, which are not content |
| 17, 37 (svg only) | `Kabir`, `Riya`, `Dev`, `Ananya`, `Baker` | the cast rigs' `aria-label`s; not visible text |
