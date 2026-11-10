<!-- cSpell:ignore NxtWave devPort hyperscaler hyperscalers CtrlS Yotta MeghRaj GovCloud Rekognition SageMaker Beanstalk egress multitenant OpenStack -->
# Cloud Computing · "Deployment & Service Models"

**STATUS: SIGNED OFF 2026-10-23** on the user's standing instruction for this
course (session 1, 2026-10-14: *"plan and execute, don't wait for the sign-off
from me, just do it"*) and today's brief: *"use the reference slides as source
of the truth and recreate the slides as you created the cloud computing
session ... don't change the wording or replace the current content"*. The
reference deck is the signed-off content; this plan maps every word of it onto
the kit, applies the user's thirteen review points, and gives every figure a
new isometric design with motion that explains. The deck is generated from it
in the same run.

| | |
|---|---|
| `SESSION_NAME` | `Deployment & Service Models` |
| `COURSE` | `cloudcomputing` (`Outputs/cloudcomputing/`), session 2 |
| Source | `Reference ppt's/deployment-and-service-models 2.html`, a built deck of 59 frames. Rendered frame by frame (`?all#/N`) and dumped: every on-slide string, every speaker note, every TR Visual Guidance line. Content only: its layouts and its flat figures are not reused |
| Project | `Outputs/cloudcomputing/deployment_and_service_models/` (copied from session 1, `cloud_computing_fundamentals`, per the course skill R1: the player options and the fixed slide types live in that session's kit files) |
| Deck file | `src/decks/deployDeck.tsx` |
| Figures | `src/decks/figures/iso/` (new), reusing only the slide frame (`figures/scene.tsx` `Card`), the loop helpers and the entrance layer from session 1 |
| Slide count | **60** (59 reference frames; Thank You and All the Best are two frames per content rule 41) |
| `devPort` | `5271` |
| `htmlName` | `deployment-and-service-models` |

## The one idea

Two questions decide any cloud setup. WHERE the infrastructure sits and who
owns it is the deployment model: public, private, hybrid, community, and
multi-cloud across providers. WHAT the provider takes off your hands is the
service model: IaaS, PaaS, SaaS, then FaaS and AI/ML as a service. Every
picture in the deck answers one of those two questions, and the economics
section prices the answer.

## Decisions

1. **Every word of the reference is kept.** Titles, kickers, leads, bullets,
   table cells, chip and figure labels, analogy labels and claims are the
   reference's own strings. Only punctuation moves where a hard rule requires
   it (a line never ends in a full stop, rule 36). The reference's speaker
   notes (the TR's) are the deck's `notes`; its TR analogy sentences go to
   notes through `analogy()`. Nothing is paraphrased.
2. **The user's thirteen points** (2026-10-23), by reference slide number:
   - *Section breakers carry no description* (slide 5 and 17, 24, 33, 42): the
     kit `SectionBreakerSlide` with `index` and `title` only. The sub line is
     not shown on the breaker; the agenda and Key Takeaways show the five
     titles only, as session 1 does (user, 2026-10-23, on session 1's
     takeaways: the agenda's items and nothing more).
   - *Redesign the analogies* (8, 11, 14, 20, 28, 30, 32, 37, 40, 46, 48, 50):
     every analogy is one `IsoAnalogy` frame: the everyday scene and the cloud
     scene on two isometric stages, `SAME IDEA` between them, the claim under;
     each scene is a short self-running loop whose motion IS the analogy (the
     riders board the one cab; the overflow goes next door and comes back).
     The labels are the reference's.
   - *Slide 9, the private-cloud picture, was not correct*: drawn to the TR's
     Visual Guidance word for word: left, a building inside the
     organisation's own fence; right, the same dedicated building inside the
     provider's larger data-centre fence, with the other servers greyed.
   - *Slide 12, the hybrid picture, was not correct*: the reference showed
     two separate boxes with a plus between them. The hybrid is one linked
     system: Enterprise P's fenced private site and the public provider,
     joined by a bridge, with P present on both sides and workloads moving
     across the bridge; the `+` sits on the bridge as the claim.
   - *Too much gap on top of the content*: every content slide is session 1's
     `Card` frame, which keeps the lead and the body as one block (the body
     starts a fixed 28px under the lead) and centres that block in the space
     under the title. A figure never floats away from its lead.
   - *Slide 19, multi-cloud against hybrid, visuals not proper*: two labelled
     stages. Left `Multi-Cloud Strategy`: one company linked to three
     distinct provider platforms, each carrying its own mark and name. Right
     `Hybrid Cloud Strategy`: a locked private site bridged to one public
     cloud. Nothing is a cloud shape with logos pasted on it.
   - *Slide 25, the `Stack layer` heading was missing*: the stack map carries
     the heading `Stack layer` over its layer names, as the TR's table does.
   - *Slide 26, the table repeats slide 25*: the TR table's cell values
     (`Customer` / `Provider` per layer per model) are now the words inside
     slide 25's slabs, so 25 IS the TR's table, drawn. Slide 26 keeps its own
     lead sentence and draws THAT: a grid of deployment models against
     service models showing that any service model runs on any deployment
     model, with the TR's two examples (`private-cloud IaaS`, `public-cloud
     SaaS`) lit. No TR string is dropped; the table's words moved one slide up.
   - *Slides 27, 29, 31 differ from the TR doc's visuals*: each is drawn to
     the TR's own diagram as the reference's notes describe it: a cloud
     labelled IaaS with three connectors down to compute, storage and
     network; a cloud labelled PaaS above the managed operating system and
     runtime and the one thing the customer brings; a cloud labelled SaaS
     delivering a finished application to several devices. The session 2 TR
     PDF is not in `Reference ppt's/` (only session 1's is), so the notes'
     description of the TR diagram is the spec; see the open question at the
     end.
   - *Slide 35, a gap between the content and the points*: the points sit
     directly under the lead in the `Card` block, with a figure beside them
     (the four triggers firing a function) so the column is tight.
   - *Slide 45, format it*: the four bullets become a two-column frame: the
     points on the left, and on the right the approvals ladder the points
     describe (board-level for CapEx, departmental for OpEx), the tax-timing
     strip, and the AWS Cost and Usage Report tile. Labels are the bullets'
     own words, shortened to their nouns.
3. **The TR's Visual Guidance is the spec for every figure.** Where the
   reference's notes quote it (6, 7, 9, 13, 15, 16, 18, 21, 22, 25, 41, 47,
   52, 53, 54), the figure draws exactly those elements, in isometric form.
   Where the TR embedded its own diagram (7, 9, 12, 15, 19, 27, 29, 31), the
   figure is that diagram redrawn with every label. Slide 54 draws no map of
   India (a hand-traced border is a contested line and carries no geography at
   this size; the reference reached the same decision): an in-country zone
   with one pin per provider, the hyperscalers on a separate platform.
4. **The visual style is isometric, not session 1's clay scenes** (user:
   "ignore the illustration style that is currently used in session 1").
   One engine, `figures/iso/iso.tsx`: a true isometric projection (30°, the
   2:1 pixel ratio), cuboids drawn as three faces with fixed shading (top
   lightest, left mid, right darkest), a floor grid, a connector that runs
   along the floor between two objects with packets travelling on it, and a
   catalogue of objects every slide draws from: server rack, storage
   cylinders, router with cables, cloud platform, building, fenced plot,
   laptop, phone, tablet, person (small, faceless), price tag, ledger, meter,
   gauge, ticket, pizza oven. Colours from `tokens.ts` plus two owner
   colours used on every service-model frame: brand blue for the provider,
   amber for the customer. The techniques come from the user's skill repos
   (isometric projection and face shading from ai-iso-skill / anatomy /
   iso-topology / iso-scene; diagram grammar, lanes and packet motion from
   system-atlas / Archscribe / SeeCode; explainer sequencing and the
   provider/customer split from visual-explainer / explainer-pack /
   html-artifacts / live-panel), digested into `workflow/skills` notes for
   this session.
5. **Every figure moves, and only to explain** (content rule: motion with a
   job). Each scene is a self-running loop (`useLoop` / `useCycle`, 8s laps,
   2.4s steps) held still on harness URLs and in picker thumbnails: packets
   travel where data travels, a gauge fills before a burst, slabs change
   owner as the ownership line passes, blocks stack as cost accrues, a
   function appears only on its trigger. Nothing decorative loops. Entrances
   are session 1's 1.5s reading-order layer (`entrance.ts`, unchanged: the
   user asked for exactly that timing on 2026-10-22).
6. **No builds, no Next, no Autoplay** (session 1's standard, kept):
   `revealEveryStep()`; every beat is on screen when the slide opens. The
   player hides the step/slide switch (course skill R1).
7. **Fixed frames from the kit and session 1**, never redrawn: `BrandSlide`,
   `WelcomeSlide minimal`, `AgendaSlide` (titles only, static), the five
   `SectionBreakerSlide`s, `ClassroomQuiz` (two, in the reference's slots),
   `Takeaways` (the standard, the five agenda titles), `NextSessionSlide`,
   `FeedbackSlide` (content rule 41: every deck; session 1's deletion was for
   that deck only), `ThankYouSlide` twice. The recap frame (reference 3) uses
   the Takeaways layout with the kicker `Recap` and the previous session's
   name as its title, the previous session's five titles as its items.
8. **Logos** (rules 12 and 13): AWS from `assets/tech/aws.png`; the Azure and
   Google Cloud marks are the reference's own embedded files, placed in
   `slide-kit/assets/companies/` first and copied to the session. No other
   vendor mark is drawn; the Indian providers are named in text, as in the
   reference.
9. **Tables** use the kit `DataTable` (10, 16, 26 is not a table any more,
   41, 51, 53): the TR's column heads and cells verbatim; slide 16's `Owned
   by` cells carry the shared-to-dedicated shade dot the TR asks for, and
   slide 41's `Provider manages` cells deepen row by row.
10. **Frameworks, as the TR runs them** (no new framework is named):
    - Deployment models (section 1) run **SCQA**: situation and complication
      on slide 6 (every workload needs infrastructure, no single arrangement
      suits every organisation), the question is which model, the answers are
      slides 7 to 15, the proof is the comparison table on 16.
    - Multi-cloud (section 2) runs **STAR**: the situation (one provider),
      the task (resilience, leverage, regulation on 21), the action (the
      split on 18 and 19), the result and its cost (22).
    - Service models (sections 3 and 4) run **Merrill**: the whole stack
      shown first (25, 26), then each model as one shift of the ownership
      line (27 to 32), then the two newer models applied to the same axis
      (34 to 40), and the full spectrum as the check (41).
    - Economics (section 5) runs **4MAT**: why the cost shape matters (43,
      44, 45, the analogies), what TCO and the three pricing models are (47,
      49, 51, 52), how a provider is chosen (53, 54).
11. **Term ledger**, each term introduced before it is used: public cloud,
    multi-tenant (7) → private cloud, on-premise, hosted (9) → hybrid cloud,
    cloud bursting (12, 13) → community cloud (15) → multi-cloud (18) →
    egress, IAM expanded as identity and access management (22) → IaaS, PaaS,
    SaaS as the TR's full names (25, 27, 29, 31) → FaaS, serverless (34, 35)
    → AI/ML-as-a-Service (34, 38) → CapEx, OpEx (44) → TCO (47) → on-demand,
    committed use, spot (49) → hyperscaler (53), BFSI expanded (54). The
    reference's expansions (AWS, GPUs, IAM, BFSI) are kept as written.

## The slides

Reference frame numbers are the source's own (1 to 59). `Card` is session 1's
content frame (kit header, lead and body as one centred block). Strings in
quotes are the reference's, verbatim; a figure's labels are listed where they
are on-slide text.

| # | Ref | id | Frame | Content (verbatim strings) | Figure and motion |
|---|---|---|---|---|---|
| 1 | 1 | `brand` | `BrandSlide` | `Welcome!` | kit |
| 2 | 2 | `welcome` | `WelcomeSlide minimal` | `Deployment & Service Models` | kit |
| 3 | 3 | `recap` | `Takeaways` layout | kicker `Recap`, title `Cloud Computing Fundamentals`; items `Cloud Computing Basics`, `History & Evolution`, `Essential Characteristics - I`, `Essential Characteristics - II`, `Benefits & Challenges` | the standard takeaways frame |
| 4 | 4 | `agenda` | `AgendaSlide` | `Agenda` over the session name; `Cloud Deployment Models`, `Multi-Cloud`, `Service Models`, `Beyond the Big Three`, `Cloud Economics & Providers` | kit, static |
| 5 | 5 | `s1` | `SectionBreakerSlide 1` | `Cloud Deployment Models` | title only |
| 6 | 6 | `deploy-map` | `Card` | kicker `Deployment Models Map`, title `Four Ways To Deploy`, lead "Every workload needs infrastructure somewhere, and no single arrangement of ownership, location and sharing suits every organisation's control and compliance needs"; labels `Infrastructure Choice`, `FULLY SHARED`, `FULLY DEDICATED`; `Public cloud` / `provider-owned, shared across tenants`; `Community cloud` / `shared by organisations with common needs`; `Hybrid cloud` / `private and public linked together`; `Private cloud` / `dedicated, either on-premise or hosted` | **Spectrum floor.** An isometric floor rail from FULLY SHARED to FULLY DEDICATED with four sites on it: a large shared hall with many tenant lights (public), a hall ringed by three member buildings (community), a small fenced site bridged to the hall (hybrid), one fenced building alone (private). The `Infrastructure Choice` node hangs above; a pointer walks the rail and lights each site in turn, its card lifting (loop) |
| 7 | 7 | `public` | `Card`, points left, figure right | kicker `Public Cloud`, title `Shared Multi-Tenant Infrastructure`, lead "A provider such as Amazon Web Services (AWS) builds and operates the data centres, then rents capacity to any customer over the internet on shared hardware"; points "Infrastructure owned and run entirely by the provider", "Many tenants share hardware, isolated logically from each other", "Capacity scales rapidly across resources pooled across customers", "Best fit: variable workloads, fast launch, low compliance limits"; labels `Cloud Service Provider`, `Enterprise P`, `Enterprise Q`, `User R` | **The TR's diagram, isometric.** The provider's data-centre hall (racks inside, tenant slots lit in three colours) in the centre; Enterprise P and Q on either side, User R below, each a small site; connectors with packets flowing OUT from the provider to all three (loop). The AWS mark on the hall's sign |
| 8 | 8 | `public-analogy` | `IsoAnalogy` | `A shared cab` · `SAME IDEA` · `Public cloud` · claim `Many riders share one vehicle` | left: one cab on a street, riders of three colours board at the stop and share the ride (loop); right: one provider rack whose slots light in the same three colours as each rider boards |
| 9 | 9 | `private` | `Card`, figure full width | kicker `Private Cloud`, title `On-Premise Vs Hosted`, lead "Private cloud dedicates infrastructure to one organisation only, chosen when compliance, data residency or latency needs rule out shared public hardware"; labels `On-Premise Private Cloud`, `ENTERPRISE P`, `Private cloud`, `Externally Hosted Private Cloud`, `CLOUD SERVICE PROVIDER`, `Other servers`, `Enterprise P`, `Dedicated for Enterprise P` | **The TR's split diagram.** Left: Enterprise P's own fenced plot with its building and one rack labelled `Private cloud`. Right: the provider's larger fence holding several grey racks (`Other servers`) and one lit rack labelled `Enterprise P`, with the caption `Dedicated for Enterprise P`. The fences draw themselves; the dedicated rack glows; a padlock on each fence gate |
| 10 | 10 | `private-table` | `Card` + `DataTable` | columns `Aspect`, `On-Premise Private`, `Hosted Private`; rows `Location` / `Organisation's own data centre` / `Provider's data centre, dedicated section`; `Owned by` / `The organisation itself` / `Provider, leased to one customer`; `Example` / `In-house VMware or OpenStack cluster` / `VMware Cloud on AWS`; `Control` / `Full physical and logical control` / `Full logical control, no physical access` | kit table |
| 11 | 11 | `private-analogy` | `IsoAnalogy` | `Build a house or rent a bungalow` · `On-premise or hosted private cloud` · `Both are yours alone` | left: a house going up on your own plot (a crane lowers the roof) beside a finished bungalow in a gated estate with a rent sign; one key each. Right: a rack in your own building and a dedicated rack in the provider's hall; one key each, the key turns (loop) |
| 12 | 12 | `hybrid` | `Card`, figure full width | kicker `Hybrid Cloud`, title `Cloud Bursting Explained`, lead "Hybrid cloud links private and public infrastructure so workloads move between them, avoiding the need to size on-premise capacity for rare demand peaks"; labels `Private cloud`, `ENTERPRISE P`, `Private cloud`, `+`, `Public cloud`, `Enterprise P`, `Cloud Service Provider`, `Enterprise Q` | **One linked system.** Enterprise P's fenced private site on the left, the provider's hall on the right with Enterprise P's and Enterprise Q's slots; a bridge between them carrying the `+`; workload cubes cross the bridge from P's private rack to P's public slot and back (loop) |
| 13 | 13 | `hybrid-burst` | `Card`, points left, figure right | points "Sudden overload bursts into public cloud capacity temporarily", "Cloud bursting: automatic overflow triggered by demand thresholds", "Example: AWS Outposts extends AWS infrastructure into on-premise sites"; labels `Private Infrastructure`, `threshold`, `burst`, `Public Cloud` | **The TR's gauge.** The private rack with a vertical load gauge and a threshold line; the gauge fills; only past the line does a dashed `burst` arrow draw to the public cloud and its extra racks light; the load falls and they go dark (loop) |
| 14 | 14 | `hybrid-analogy` | `IsoAnalogy` | `A banquet hall for the rush` · `Cloud bursting` · `Extra capacity only while the rush lasts` | left: a restaurant kitchen with two ovens; the order queue grows; the banquet hall's ovens next door light and take the overflow; the queue clears and they switch off (loop). Right: the private rack, the public rack lighting on the same beat |
| 15 | 15 | `community` | `Card`, points left, figure right | kicker `Community Cloud`, title `Shared Among Peers`, lead "Community cloud is infrastructure shared by several organisations with common regulatory, security or mission needs, rather than opened to the general public"; points "Governance and compliance rules set jointly by member organisations", "Cost split among fewer tenants than public, more than solo private", "Example: AWS GovCloud (US), reserved for government agencies and partners", "Typical users: government bodies, healthcare consortiums, research collaborations"; labels `COMMUNITY CLOUD`, `Shared infrastructure`, `Government`, `Healthcare`, `Research`, `General public: not admitted` | **Ringed hall.** A shared hall inside a dashed ring; three member buildings (government, healthcare, research) linked to it with packets; outside the ring a grey crowd and a barrier labelled `General public: not admitted`; a public packet reaches the ring and bounces (loop) |
| 16 | 16 | `deploy-compared` | `Card` + `DataTable` | kicker `Deployment Models Compared`, title `Ownership Tenancy Use Case`, lead "Choosing a deployment model trades control for convenience: full ownership costs more effort, full sharing costs less control"; columns `Model`, `Owned by`, `Tenancy`, `Typical use`; the five rows verbatim (`Public` / `Provider` / `Multi-tenant` / `Variable, public-facing workloads` … `Community` / `Member organisations, or a third party` / `Shared within group` / `Sector-specific compliance, for example government`) | kit table; the `Owned by` cell carries a dot shaded pale to deep along the shared-to-dedicated scale (TR Visual Guidance) |
| 17 | 17 | `s2` | `SectionBreakerSlide 2` | `Multi-Cloud` | title only |
| 18 | 18 | `multicloud` | `Card`, figure full width | kicker `Multi-Cloud Defined`, title `Multiple Providers Together`, lead "Multi-cloud means running workloads across two or more independent public providers at once, unlike hybrid cloud, which mixes public with private infrastructure"; labels `Your company`, "AWS handles general-purpose compute and storage workloads", "Azure serves Microsoft-integrated enterprise applications", "GCP powers data analytics and AI/ML pipelines" | **The TR's branching diagram.** Your company's building on the left; three provider platforms on the right, each with its mark; three connectors, each carrying its workload line; packets flow on all three at once (loop) |
| 19 | 19 | `multi-vs-hybrid` | `Card`, two stages | labels `Multi-Cloud Strategy`, `Private Cloud`, `Public Cloud`, `Hybrid Cloud Strategy` (marks: AWS, Azure, Google Cloud) | **Two strategies, side by side.** Left stage: one company linked to three distinct provider platforms, each mark with its own name. Right stage: a locked private site bridged both ways to one public platform. Packets run on both (loop) |
| 20 | 20 | `multicloud-analogy` | `IsoAnalogy` | `Two banks for your savings` · `Multi-cloud` · `One fails, the work carries on` | left: a person's savings split between two banks; one bank's shutter comes down; the person still withdraws from the other (loop). Right: two provider platforms; one goes dark; the traffic reroutes to the other |
| 21 | 21 | `motivations` | `Card`, three tiles | kicker `Multi-Cloud Motivations`, title `Resilience Negotiation Regulation`, lead "Three business pressures push organizations toward multiple providers even though it adds complexity"; `Resilience` / "a second provider keeps services running during an outage"; `Negotiation leverage` / "comparing quotes across vendors avoids one-sided pricing"; `Regulation` / "in-country hosting or concentration-risk rules may require a compliant region or a second provider" | three isometric tiles with the TR's icons (shield, handshake, gavel) standing on them; each tile lifts in turn (loop) |
| 22 | 22 | `overhead` | `Card`, points left, figure right | kicker `Operational Overhead Cost`, title `Managing Multiple Platforms`, lead "Multi-cloud earns its resilience and leverage at a real operational price: every added provider multiplies what must be learned, managed and paid for"; points "Separate consoles, APIs and billing dashboards per provider", "Distinct certifications and skill sets needed for each platform's staff", "Cross-cloud data transfer (egress) charges between providers", "Duplicate monitoring, security and IAM (identity and access management) policies to maintain"; rows `Skills`, `Tooling`, `Billing`, `Security` | **The TR's duplicated-icon grid.** Four rows by three provider columns (the marks as column heads); the same icon stamps into all three cells of a row together, row by row (loop) |
| 23 | 23 | `quiz-mid` | `ClassroomQuiz` | | the standard quiz frame; the reference's three steps go to notes |
| 24 | 24 | `s3` | `SectionBreakerSlide 3` | `Service Models` | title only |
| 25 | 25 | `stack` | `Card`, figure full width | kicker `Service Model Spectrum`, title `Stack Ownership Map`, lead "The three service models share one technology stack; each shifts the line dividing provider-managed layers from customer-managed layers"; heading `Stack layer`; layers `Application`, `Data & access configuration`, `Runtime & middleware`, `Operating system`, `Virtualization, servers, storage, network`; columns `IaaS`, `PaaS`, `SaaS`; cell words `Customer` / `Provider` (the TR table's values); legend `Provider manages`, `Customer manages` | **Three towers.** Three isometric towers of five slabs, one per model, the layer names on the left under `Stack layer`; each slab is blue or amber and carries its word; a glowing ownership plane sits at a different height on each tower, and it glides from tower to tower (loop) |
| 26 | 26 | `stack-grid` | `Card`, figure full width | lead "Deployment models say where the infrastructure sits and who owns it; service models say what is abstracted. Any service model can run on any deployment model (for example, private-cloud IaaS, public-cloud SaaS)" (two lines, rule 36); axis labels the model names; the two examples `private-cloud IaaS`, `public-cloud SaaS` | **Any on any.** An isometric floor grid: deployment models along one edge (Public, Private, Hybrid, Community), service models along the other (IaaS, PaaS, SaaS); every cell holds a small platform; the two TR examples light with their names (loop lights each example in turn) |
| 27 | 27 | `iaas` | `Card`, points left, figure right | kicker `IaaS Explained`, title `Raw Infrastructure Rental`, lead "Infrastructure as a Service rents compute, storage and network as raw building blocks, leaving the operating system and everything above it to the customer"; points "Abstracts physical hardware, racking and data-centre wiring", "Customer installs OS, runtime, middleware and application", "Representative services: AWS (Amazon Web Services) EC2, EBS, VPC", "Azure Virtual Machines, GCP Compute Engine offer same layer"; labels `IaaS`, `Compute`, `Storage`, `Network` | **The TR's diagram.** A cloud labelled IaaS over three isometric blocks: a server (Compute), stacked cylinders (Storage), a router with cables (Network); three connectors down from the cloud, packets dripping (loop). All blue: provider-managed |
| 28 | 28 | `iaas-analogy` | `IsoAnalogy` | `Kitchen space only` · `IaaS` · `You bring everything above the oven` | left: a bare kitchen with an oven (blue); the customer carries in dough, sauce and toppings (amber) and assembles the pizza (loop). Right: the stack with the infrastructure slab blue and OS, runtime, application slabs arriving amber. The same four layers on all three pizza frames |
| 29 | 29 | `paas` | `Card`, points left, figure right | kicker `PaaS Explained`, title `Ready-Made Platform`, lead "Platform as a Service adds a managed operating system and runtime atop infrastructure, so the customer only builds, deploys and runs application code"; points "Abstracts OS patching, runtime setup and server scaling", "Less control over OS-level tuning than IaaS allows", "Representative services: AWS Elastic Beanstalk, AWS App Runner", "Azure App Service, GCP App Engine offer same layer"; labels `PaaS`, `Operating system`, `Runtime`, `Your application` | **The TR's diagram.** A cloud labelled PaaS over a managed platform (Operating system and Runtime blocks, blue) with the customer's application cube (amber) lowered onto it (loop) |
| 30 | 30 | `paas-analogy` | `IsoAnalogy` | `Kitchen and dough ready` · `PaaS` · `You bring only the toppings` | left: the kitchen with oven AND dough ready (blue); the customer brings only the toppings (amber). Right: one amber slab on the stack |
| 31 | 31 | `saas` | `Card`, points left, figure right | kicker `SaaS Explained`, title `Complete Application Delivered`, lead "Software as a Service delivers a finished application; the provider manages every layer beneath it, leaving the customer only account setup and data"; points "Abstracts the entire stack below the application", "Provider pushes feature updates automatically, no customer action", "Representative services: Gmail/Google Workspace, Salesforce, Microsoft 365", "Customer effort and control both fall sharply toward SaaS"; labels `SaaS`, `Finished application`, `Automatic updates`, `Your data` | **The TR's diagram.** A cloud labelled SaaS delivering the finished application to three isometric devices (laptop, tablet, phone); an update badge pulses on the cloud; the customer's data (amber) is the only thing on the user's side (loop) |
| 32 | 32 | `saas-analogy` | `IsoAnalogy` | `A ready-made pizza` · `SaaS` · `You bring nothing but an order` | left: a delivery scooter brings the boxed pizza to the door; the customer holds only an order slip (loop). Right: the whole stack blue; the data the one amber cube |
| 33 | 33 | `s4` | `SectionBreakerSlide 4` | `Beyond the Big Three` | title only |
| 34 | 34 | `beyond` | `Card`, points left, figure right | kicker `Beyond The Big Three`, title `New Service Models`, lead "Cloud service models did not stop at IaaS, PaaS and SaaS. Two further models push abstraction higher, changing what the provider manages and what the developer retains" (two lines); points "Function as a Service (FaaS): runs code per trigger, no visible server", "Serverless: broader term covering FaaS plus managed databases and queues", "AI/ML-as-a-Service: consumes pre-built AI and ML models via API", "Both shift most infrastructure responsibility onto the cloud provider"; labels `RISING ABSTRACTION`, `AI/ML-as-a-Service`, `FaaS / Serverless`, `SaaS`, `PaaS`, `IaaS`, `Provider`, `User`, `USER RESPONSIBILITY SHRINKS` | **The staircase.** Five isometric steps rising left to right (IaaS to AI/ML); each step's top is a bar split blue and amber, the amber shrinking as the steps rise; the steps rise one after another (loop) |
| 35 | 35 | `faas` | `Card`, points left, figure right | kicker `FaaS And Serverless`, title `Pay Per Execution`, lead "Function as a Service (FaaS) runs a single function only when triggered, removing any need to provision or manage a server"; points "Triggers: HTTP request, scheduled timer, queue message, file upload", "Scales automatically from zero to many parallel invocations", "Billed per invocation and execution time, not idle time", "Runs on AWS Lambda; cold start delay if idle first" | **Triggers.** Four trigger sources (HTTP, timer, queue, file) around an empty platform; a trigger fires, a function cube appears, runs and vanishes; two triggers at once make two cubes (loop) |
| 36 | 36 | `faas-timeline` | `Card`, figure full width | labels `AWS LAMBDA`, `Idle`, `Trigger event`, `Function instantiated`, `Executes`, `Torn down`, `BILLED ONLY WHILE IT RUNS` | **A function's life.** Five stations on an isometric floor; the function cube appears at the third, runs at the fourth (a meter spins) and is torn down at the fifth; the billing bracket lights only across the third and fourth (loop) |
| 37 | 37 | `faas-analogy` | `IsoAnalogy` | `A cab for one trip` · `Function as a Service` · `Pay only while it runs` | left: a cab is hailed, the meter runs only for the trip, the cab leaves (loop). Right: the function instance appears, its meter runs, it is torn down |
| 38 | 38 | `aiml` | `Card`, points left, figure right | kicker `AI ML As Service`, title `Pre-Built Intelligence APIs`, lead "AI/ML-as-a-Service (Artificial Intelligence, Machine Learning as a Service) exposes pre-trained vision, language and forecasting models through a plain API call"; points "Representative services: Amazon Rekognition, Comprehend (pre-built APIs)", "Provider manages model training, GPUs (Graphics Processing Units) and hosting", "User manages input data and API integration only", "Used in vision, chatbots, fraud and forecasting" | **The model service.** An isometric service building with an API door and three model icons on its sign (vision, language, forecasting); GPU racks inside are blue; the user's input-data cube is amber at the door (loop: a request enters, a result leaves) |
| 39 | 39 | `aiml-flow` | `Card`, figure full width | labels `Application`, `API call`, `Pre-trained model service`, `AMAZON SAGEMAKER`, `REKOGNITION`, `Prediction returned` | **The round trip.** The application device on the left, the model service on the right; an `API call` packet travels there along the floor, a `Prediction returned` packet travels back (loop) |
| 40 | 40 | `aiml-analogy` | `IsoAnalogy` | `One consultation, no hospital` · `AI/ML-as-a-Service` · `Use the intelligence, skip the building` | left: a patient at a specialist's desk; the hospital building behind is faded out (not built). Right: the app calls the model API; the GPU hall behind is the provider's, faded on the user's side |
| 41 | 41 | `responsibility` | `Card` + `DataTable` | kicker `Full Responsibility Spectrum`, title `Provider Vs User`, lead "Moving from IaaS toward SaaS steadily shifts management from user to provider; FaaS and AI/ML-as-a-Service remove the server concept, but the user still manages function code or input data respectively"; columns `Model`, `Provider manages`, `User manages`; the five rows verbatim | kit table; the `Provider manages` cell tint deepens row by row (TR Visual Guidance) |
| 42 | 42 | `s5` | `SectionBreakerSlide 5` | `Cloud Economics & Providers` | title only |
| 43 | 43 | `econ-map` | `Card`, four tiles | kicker `Cloud Economics Map`, title `Costs And Providers`, lead "Cloud adoption decisions turn on how spending is structured and who supplies the infrastructure"; `CapEx vs OpEx` / `how spend is classified`; `TCO` / `true multi-year cost of a choice`; `Pricing models` / `on-demand, committed use, spot`; `Providers` / `global hyperscalers and Indian regional players` | four isometric tiles with objects on them (a ledger, a calculator, a price tag, a globe); each lifts in turn (loop) |
| 44 | 44 | `capex-opex` | `Card`, points left, figure right | kicker `CapEx vs OpEx`, title `Balance Sheet Impact`, lead "Cloud does not just change how much is paid; it changes which financial statement absorbs the cost, reshaping approvals and tax treatment"; points "CapEx: capitalised, depreciated over asset life, sits on balance sheet", "OpEx: expensed immediately, hits the income statement same period"; labels `Balance sheet`, `CAPEX`, `DEPRECIATED OVER TIME`, `Income statement`, `OPEX`, `THE SAME EACH MONTH` | **Two ledgers.** Two isometric ledger books; on the first one tall block that steps down year by year (depreciation); on the second a row of equal small blocks appearing month by month (loop) |
| 45 | 45 | `capex-opex-more` | `Card`, points left, figure right | points "CapEx typically needs board-level capital approval", "OpEx approval sits within departmental budgets", "Depreciation deductions (CapEx) shift tax timing versus OpEx's immediate deduction", "AWS Cost and Usage Report classifies spend for finance systems"; figure labels `Board-level capital approval`, `Departmental budgets`, `Depreciation deductions`, `Immediate deduction`, `AWS Cost and Usage Report` | **The approvals ladder.** A boardroom table on a high platform (CapEx's approval) and a department desk on a low one (OpEx's); a tax-timing strip under them: one spread over years, one immediate; a report tile beside, stamped by AWS. The CapEx request climbs to the board; the OpEx request is signed at the desk (loop) |
| 46 | 46 | `capex-analogy` | `IsoAnalogy` | `A house on a loan, or rent` · `CapEx and OpEx` · `One is an asset, one is a monthly cost` | left: a house with a loan tag (an asset) and a rented flat with monthly coins (loop: a coin each month). Right: an owned rack with an asset tag; a cloud invoice arriving monthly |
| 47 | 47 | `tco` | `Card`, points left, figure right | kicker `Total Cost Ownership`, title `Beyond The Price Tag`, lead "Total cost of ownership (TCO) totals every direct and indirect cost of running a workload across its life, not only the sticker price"; points "Direct costs: compute, storage, licensing, network transfer", "Indirect costs: staffing, training, downtime, migration effort", "On-premise adds power, cooling, floor space, hardware refresh", "AWS Pricing Calculator estimates cloud cost", "Migration Evaluator builds the on-premise vs cloud business case"; labels `Sticker price`, `Staffing`, `Power`, `Downtime`, `True cost of ownership` | **The TR's layered bar.** An isometric column: the sticker-price block at the base, then staffing, power and downtime blocks stacking on top one by one; the `True cost of ownership` bracket grows with it (loop) |
| 48 | 48 | `tco-analogy` | `IsoAnalogy` | `A phone's price tag` · `Server TCO` · `The price tag is only the start` | left: a phone with its price tag; data plan, repairs and accessories blocks stack beside it (loop). Right: a server with its price tag; staffing, power and downtime stack beside it |
| 49 | 49 | `pricing` | `Card`, points left, figure right | kicker `Three Pricing Models`, title `On-Demand To Spot`, lead "Providers meter usage but let buyers trade commitment for discount; three payment patterns cover most cloud spend"; points "On-demand: metered pay-as-used rate, zero commitment", "Committed use: one to three-year term for lower fixed rate", "Spot: spare capacity at a steep discount; can be reclaimed at short notice", "Trade-off across all three: flexibility versus price"; labels `On-Demand`, `Committed Use`, `Spot`, `PRICE FALLS` | **The ramp.** Three price tags on three descending isometric steps, the price falling along a `PRICE FALLS` arrow; the spot tag is snatched back by a reclaim hook and returns (loop) |
| 50 | 50 | `pricing-analogy` | `IsoAnalogy` | `Three kinds of train ticket` · `On-demand, committed, spot` · `Less flexibility, lower price` | left: a station counter with three tickets: a walk-up ticket, a season pass, a standby ticket that can be bumped (loop: the standby holder steps aside when the train fills). Right: three compute tokens with the same three behaviours |
| 51 | 51 | `pricing-table` | `Card` + `DataTable` | kicker `Pricing Models Compared`, title `Discount And Risk`, lead "Each pricing model suits a different workload shape; committed-use discounts deepen with longer terms and more upfront payment"; columns `Model`, `Commitment`, `Typical discount`, `Key risk`, `Best for`; the three rows verbatim | kit table |
| 52 | 52 | `pricing-bars` | `Card`, figure full width | labels `Baseline rate` / `On-Demand` / `Highest unit price`; `Up to ~70% off` / `Committed Use` / `Locked in for 1 or 3 years`; `Up to ~90% off` / `Spot` / `Can be reclaimed at short notice` | **The TR's bar chart, isometric.** Three bars rising from the floor to the TR's own numbers (a stub, ~70, ~90); each bar's flexibility note under it; the bars grow in turn (loop) |
| 53 | 53 | `providers` | `Card`, marks row + `DataTable` | kicker `Global Cloud Providers`, title `AWS Azure GCP`, lead "Three hyperscalers dominate global cloud spend, each with a different platform strength that shapes provider choice"; keywords `Breadth`, `Enterprise`, `Data and AI/ML`; columns `Provider`, `Parent company`, `Notable strength`; rows `AWS` / `Amazon` / `Broadest service catalog, largest market share`; `Azure` / `Microsoft` / `Strong enterprise and hybrid integration (Active Directory)`; `Google Cloud (GCP)` / `Google` / `Data analytics, AI/ML tooling strength` | three marks on three isometric platforms with the keyword under each (TR Visual Guidance), the table beneath |
| 54 | 54 | `india` | `Card`, points left, figure right | kicker `Indian Cloud Providers`, title `Regional Alternatives`, lead "Alongside global hyperscalers, Indian providers compete on data residency, latency for local users, and rupee-denominated billing"; points "CtrlS, Yotta, E2E Networks: private data-centre players", "Government's GI Cloud (MeghRaj) hosts public-sector workloads", "BFSI (banking, financial services and insurance) and government workloads often mandate in-country storage", "Regional providers can undercut hyperscaler pricing for local traffic"; labels `INSIDE INDIA`, `CtrlS`, `Yotta`, `E2E Networks`, `GI Cloud (MeghRaj)`, `GLOBAL HYPERSCALERS` | **In-country zone.** An isometric platform labelled INSIDE INDIA with four data-centre pins; a separate platform offshore with the three hyperscaler marks; a data packet circles inside the zone and never leaves it (loop). No map outline (decision 3) |
| 55 | 55 | `quiz-close` | `ClassroomQuiz` | | the standard quiz frame |
| 56 | 56 | `takeaways` | `Takeaways` | the five agenda titles | the standard frame |
| 57 | 57 | `next-session` | `NextSessionSlide` | `Virtualization & Hypervisors` | kit |
| 58 | 58 | `feedback` | `FeedbackSlide` | | kit, content rule 41 |
| 59 | 59 | `thank-you` | `ThankYouSlide` | `Thank You` | kit |
| 60 | 59 | `all-the-best` | `ThankYouSlide` | `All the Best` | kit |

## Checks

The full session 1 list (`cloud_computing_fundamentals/CLAUDE.md`, "Checks"),
with `68` replaced by `60` and the port by `5271`: typecheck, build, qa,
video-safe, align-check, mixed-align-check, box-overflow-check,
controls-clear-check, `.text-audit.mjs`, build-reveal-steps, agenda-check,
ligature-check, overlap-check, gesture-check, phone-nav-check, autohide-check,
nav-stress-check, feedback-check (applies again: the deck has the feedback
slide), and the contact sheet read by eye at the still state and in motion.

## Open question for the user

The session 2 TR PDF is not in `Reference ppt's/` (only session 1's
`1. Cloud Computing Fundamentals.pdf` is there). Slides 27, 29 and 31 are
drawn to the TR diagrams as the reference's own notes describe them. If the
PDF is dropped into `Reference ppt's/`, the three can be checked against the
TR's actual pictures in one pass.
