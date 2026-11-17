# Cloud Computing · "Building a Cloud Network with AWS VPC"

The session deck for the practical hands-on of Cloud Networking & VPC. Read this before editing it. The kit
rules are in `KIT.md` and `../../../slide-kit/slide-template/CLAUDE.md`; the course's own rules in
`../workflow/skills/cloud-computing-course/SKILL.md`.

- **Origin (user, 2026-11-17):** Cloud Networking & VPC (`../cloud_networking_and_vpc`, 77 slides) was split in
  two. Its slides 1 to 60 stayed there; slides 61 to 77, from the "Practical Hands-On" breaker on, became this
  deck, named after that breaker's title (no "Part 1" / "Part 2" in any name). This folder is a copy of that
  project; its history, figure notes and review rounds are in `../cloud_networking_and_vpc/CLAUDE.md`.
- **Deck file:** `src/decks/labDeck.tsx`, 15 slides. Port 5276 (`npx vite --port 5276 --strictPort`).
  - Opening: Welcome (`BrandSlide`) only; the session title and recap were removed (user, 2026-11-17).
  - The practical, unchanged from the original: `D-LAB` (the breaker frame through `LabBreaker`), `T24-1` to
    `T29-1b`. Their `section` is now `Practical Hands-On` (it was section 5, Network Security Controls).
  - Closing: Thank You and All the Best. Per the user, this deck has no Agenda, Quiz, Key Takeaways or Next
    Session.
- **Figures:** `src/decks/figures/net/lab*.tsx` (`frames.tsx` for the shared pieces; the lab captures in
  `public/shots/` and `public/shots-hd/`, IDs blurred). The other section files came with the copy and only
  their CSS is loaded, as in the original, so shared class names keep working.
- **Build:** `npm run build:html` writes `dist-single/building-a-cloud-network-with-aws-vpc.html` (name and title
  from `deck.config.json`).
