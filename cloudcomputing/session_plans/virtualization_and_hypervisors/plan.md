# Virtualization & Hypervisors · slide-wise plan

STATUS: signed off on the user's word, 2026-10-27 (the request is the spec: rebuild the reference deck's
content verbatim in the session 1 and 2 format, plan and execute in one run, as sessions 2 and the AWS deck).

- **Session:** cloud computing, `Outputs/cloudcomputing/virtualization_and_hypervisors/`, port 5273.
- **Source:** `Reference ppt's/virtualization-and-hypervisors 2.html`, 62 frames, a kit-built deck. CONTENT ONLY:
  every kicker, title, lead, bullet, table cell, label and caption is the reference's string, unchanged,
  unshortened, nothing added. Rendered and dumped first (text, notes, screenshots, embedded marks).
- **TR doc:** `Reference ppt's/3. Virtualization & Hypervisors.pdf`. Comparison only, never a content source.
  Its 18 VirtualBox screenshots (pages 17-26) are the images the reference's walkthrough frames name
  (`vbox-01` to `vbox-18`); the reference file does not carry them, so they are taken from the TR as images.
- **Template:** a copy of the AWS deck (course rule R2), so it carries the cloud player (no builds, smooth
  transitions, hidden step/slide switch, presenter and student views) and the slide comments exactly as the
  AWS deck has them (`src/deck/comments.ts`, `CommentsPanel.tsx`, unchanged).

## Decisions

1. **Every word is the reference's.** Only rule 36 moves a full stop. The reference's notes (TR speaker notes,
   TR Visual Guidance) are the speaker notes and the figure spec.
2. **The visual style is session 2's current one** (session 1's 3D finish, `figures/d3/kit.tsx`): `Card` frame,
   lead and body as one block, the points rail beside a raised stage, glossy library renders (`Icon3D`) and
   session 1's clay objects, labels as HTML, one self-running loop per figure held still on harness URLs.
   The reference's and TR's diagrams are redrawn in that finish, same boxes, same names.
3. **Agenda, Key Takeaways and the recap carry the five titles only** (course rule, lesson 4, the user's
   standing word on sessions 1 and 2). Section breakers carry the title only.
4. **Analogies** keep the reference's grammar (EVERYDAY scene, IN THE CLOUD scene, numbered markers on both,
   three mapping pairs under them), drawn in the 3D finish: `PairAnalogy` in `figures/vh/frames.tsx`.
5. **Walkthroughs** (42-51) keep the reference's pairing (two screenshots a frame, numbered captions, the two
   red highlight boxes on captures 1 and 13), with its Important note callout on 42.
6. **Marks** are the reference's own embedded files, filed in `slide-kit/assets/companies/` and
   `slide-kit/assets/aws/` first (rule 13), imported from `figures/vh/marks/` so the single file inlines them.
7. **Thank you and All the Best are two frames**, as session 2 (62 reference frames, 63 slides).

4. **Review pairs and the recap art (user, 2026-10-30, after sign-off):** `agenda-1` (`AgendaColumns`, titles
   only) sits directly after `agenda`; `quiz-mid-1` and `quiz-close-1` (`QuizCard "Quiz Time!"`) directly after
   `quiz-mid` and `quiz-close`; the user keeps one of each pair. The recap frame shows the presenter illustration
   (course rule R6). The table below keeps its signed-off numbering; the deck is 66 slides while both of each
   pair stand.

## Slides

| # | id | Reference | Frame |
|---|---|---|---|
| 1 | brand | 1 | BrandSlide "Welcome!" |
| 2 | welcome | 2 | WelcomeSlide minimal |
| 3 | recap | 3 | Takeaways, kicker Recap, title "Deployment & Service Models" |
| 4 | agenda | 4 | AgendaSlide, five titles |
| 5 | s1 | 5 | Breaker: Virtualization Basics |
| 6 | landscape | 6 | Lead + five branch cards over Hypervisor over Physical server |
| 7 | benefits | 7 | Lead + benefits table + utilization bars (Before/After) |
| 8 | server | 8 | Lead + TR diagram: SERVER with four VMs, Internet, Cloud Computing, three Users |
| 9 | server-zoom | 9 | Points + one VM zoomed (Full guest OS, kernel, drivers, system files, EC2) |
| 10 | storage | 10 | Lead + points + four disks into Virtual Volume (Amazon EBS) to Application |
| 11 | storage-analogy | 11 | PairAnalogy: A bank / Storage virtualization |
| 12 | network | 12 | Lead + TR VDC diagram, pNIC/vNIC legend |
| 13 | network-loops | 13 | Points + Networks A, B, C on one cable, Amazon VPC |
| 14 | network-analogy | 14 | PairAnalogy: An office building / Network virtualization |
| 15 | desktop-app | 15 | Lead + points + remote data centre streaming Full Desktop and Single App |
| 16 | desktop-analogy | 16 | PairAnalogy: Cable TV / Desktop and app virtualization |
| 17 | types-compared | 17 | Lead + table with icons and AWS marks |
| 18 | s2 | 18 | Breaker: Hypervisors |
| 19 | vmm | 19 | Lead + TR diagram (Hardware, Hypervisor gears, three OS) + two cards |
| 20 | vmm-role | 20 | Points + three VMs on Hypervisor (VMM) on four resources |
| 21 | vmm-analogy | 21 | PairAnalogy: An apartment building / A hypervisor |
| 22 | type1 | 22 | Lead + points + Type 1 stack + marks ESXi, Hyper-V, KVM, Nitro |
| 23 | type2 | 23 | Lead + points + Type 2 stack + marks VirtualBox, Workstation, Parallels Desktop |
| 24 | type-compare | 24 | Lead + TR's two stacks + table |
| 25 | quiz-mid | 25 | ClassroomQuiz |
| 26 | s3 | 26 | Breaker: Virtualization Techniques |
| 27 | techniques | 27 | Lead + three columns (guest, arrow style, Hypervisor, caption) |
| 28 | full | 28 | Lead + callout + TR's Guest/Host/Type 1 Hypervisor diagram |
| 29 | full-path | 29 | Points + Guest OS → Hypervisor → Physical CPU + note + VMware mark |
| 30 | full-analogy | 30 | PairAnalogy: A live interpreter / Full virtualization |
| 31 | para | 31 | Lead + two TR diagrams (full, para) |
| 32 | para-path | 32 | Points + hypercall path against the trap path + Xen mark |
| 33 | para-analogy | 33 | PairAnalogy: A restaurant / Para-virtualization |
| 34 | hw-assisted | 34 | Lead + points + CPU root / non-root modes + Intel, AMD marks |
| 35 | techniques-compared | 35 | Two points + table, hardware-assisted row highlighted |
| 36 | s4 | 36 | Breaker: Virtual Machine Anatomy |
| 37 | anatomy | 37 | Lead + physical parts → Hypervisor → four virtual parts + packaging strip |
| 38 | vcpu | 38 | Lead + points + four cores, scheduler, six vCPUs, RAM pages |
| 39 | disk-nic | 39 | Lead + points + one VM, host storage file, virtual switch, NIC modes |
| 40 | artifacts | 40 | Lead + table with icons |
| 41 | create-vm | 41 | Lead + five steps + Important note |
| 42 | install-1 | 42 | Lead + Important note + capture 1 |
| 43-46 | install-2..5 | 43-46 | Captures 2-9, two a frame |
| 47-49 | wizard-1..3 | 47-49 | Captures 10-15 |
| 50 | boot-1 | 50 | Lead + capture 16 |
| 51 | boot-2 | 51 | Captures 17-18 |
| 52 | s5 | 52 | Breaker: VM Lifecycle & Migration |
| 53 | lifecycle | 53 | Lead + six stage cards, branch and converge, dashed return |
| 54 | suspend-snapshot-clone | 54 | Lead + table with icons and AWS column |
| 55 | live-migration | 55 | Lead + points + Host A → Host B pages + three numbered lines |
| 56 | live-analogy | 56 | PairAnalogy: A phone call on the move / Live migration |
| 57 | cost | 57 | Lead + four tiles |
| 58 | quiz-close | 58 | ClassroomQuiz |
| 59 | takeaways | 59 | Takeaways, five titles |
| 60 | next-session | 60 | NextSessionSlide "Containers vs Virtual Machines" |
| 61 | feedback | 61 | FeedbackSlide (content rule 41) |
| 62 | thank-you | 62 | ThankYouSlide "Thank you!" |
| 63 | all-the-best | 62 | ThankYouSlide "All the Best" |
