# Cloud Computing · "Creating Virtual Machine Using Virtual Box"

The session deck for the practical hands-on of Virtualization & Hypervisors. Read this before editing it. The
kit rules are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Origin (user, 2026-11-26):** Virtualization & Hypervisors (`../virtualization_and_hypervisors`) was split in
  two. Its slides 37 to 47 as its student view numbers them (58 slides; the 4 hidden frames not counted), from
  "Creating a VM" to "First boot 2", became this deck; the title is the user's. This folder is a copy of that
  project; its history, figure notes and review rounds are in `../virtualization_and_hypervisors/CLAUDE.md`.
- **Matched to the shared file:** the split was first cut out of the shared student-view HTML
  (`/home/nxtwave/Desktop/cloud/creating-virtual-machine-using-virtual-box/`, kept by the user). This build has the
  same slides; that file's two saved text edits (`wizard-1`: the lead line removed; `boot-1`: "above" dropped) are
  now in `src/decks/slideEdits.ts`.
- **Deck file:** `src/decks/labDeck.tsx`, 15 slides. Port 5298 (`npx vite --port 5298 --strictPort`).
  - Opening: Welcome (`BrandSlide`) only.
  - `D-LAB`: the "Practical Hands-On" divider (`SectionBreakerSlide` with a kicker, as in the other hands-on decks).
  - The practical, unchanged from the original: `create-vm`, `install-1` to `install-5`, `wizard-1` to
    `wizard-3`, `boot-1`, `boot-2`, with their speaker notes. Their `section` is `Practical Hands-On` (it was
    section 4, Virtual Machine Anatomy).
  - Closing: this deck's own Thank you! and All the Best. No Agenda, Quiz, Key Takeaways or Next Session.
- **Figures:** `src/decks/figures/vh/anatomy.tsx` (`CreateVm`) and `walk.tsx` (the VirtualBox captures in
  `figures/vh/shots/`). The other section files came with the copy and are not imported.
- **Build:** `npm run build:html` writes `dist-single/creating-virtual-machine-using-virtual-box.html` (name and
  title from `deck.config.json`).
