# Cloud Computing · "Working with Docker Images and Containers"

The session deck for the practical hands-on of Containers vs Virtual Machines. Read this before editing it. The
kit rules are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Origin (user, 2026-11-26):** Containers vs Virtual Machines (`../containers_vs_virtual_machines`, 73 slides)
  was split in two. Its slides 13 to 22 (Docker installation: setup per OS to Step 8) and 27 to 42 (Part A to
  Part B clean up) became this deck; the title is the user's. The rest stayed there. This folder is a copy of
  that project; its history, figure notes and review rounds are in `../containers_vs_virtual_machines/CLAUDE.md`.
- **Matched to the shared file:** the split was first cut out of the shared student-view HTML
  (`/home/nxtwave/Desktop/cloud/working-with-docker-images-and-containers/`, kept by the user). This build has the
  same slides; that file's one saved text edit (T11-2) is now in `src/decks/slideEdits.ts`.
- **Deck file:** `src/decks/labDeck.tsx`, 30 slides. Port 5297 (`npx vite --port 5297 --strictPort`).
  - Opening: Welcome (`BrandSlide`) only.
  - `D-LAB`: the "Practical Hands-On" divider (`SectionBreakerSlide` with a kicker, as in the other hands-on decks).
  - The practical, unchanged from the original: `T05-1` to `T05-S8`, then `T08-1` to `T11-8`. Their `section` is
    `Practical Hands-On` (it was section 2, Docker Architecture).
  - Closing: Thank You and All the Best. No Agenda, Quiz, Key Takeaways, Feedback or Next Session.
- **Figures:** `src/decks/figures/cv/install.tsx`, `docker.tsx`, `build.tsx`. The other section files came with the
  copy; their CSS is still loaded, as in the original, so shared class names keep working.
- **Build:** `npm run build:html` writes `dist-single/working-with-docker-images-and-containers.html` (name and
  title from `deck.config.json`).
