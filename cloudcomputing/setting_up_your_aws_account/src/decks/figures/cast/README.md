# cast · the Character Lab's rig, vendored for this deck

`rig/`, `skins/` and `actions/` are copied unchanged from
`slide-kit/characters-lab/src/` (2026-10-07; re-copied 2026-10-16 for the clay Library look), with only the `@/rig`, `@/skins`
and `@/actions` import paths rewritten to this folder, and one `void earX` line in `rig/Character.tsx`
(the lab declares it unused; this deck's typecheck rejects that). Do not edit them here:
fix the lab and copy again. The deck's own cast (configs, crops, held poses)
is `../Cast.tsx`.
