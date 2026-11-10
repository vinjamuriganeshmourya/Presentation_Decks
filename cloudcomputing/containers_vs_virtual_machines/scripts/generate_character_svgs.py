#!/usr/bin/env python3
"""
generate_character_svgs.py
==========================

Generates the "NxtWave Evolve" character + spot-illustration set as
self-contained SVG using Gemini's text model (gemini-flash-latest), which the
provided key can access (the raster image model is billing-gated).

SVG is ideal for slides: infinitely scalable, themeable, tiny, and animatable
with Framer Motion. Output → template/public/assets/characters/<name>.svg

The <Illustration> component renders these inline. If a billing-enabled image
key becomes available later, drop PNGs with the same base names in the same
folder and switch the component's `kind` — no slide code changes.

Usage:
    python3 scripts/generate_character_svgs.py            # all
    python3 scripts/generate_character_svgs.py nova-wave  # one
"""

import os
import re
import sys
from pathlib import Path

from google import genai
from google.genai import types

MODEL = "gemini-flash-latest"
ASSET_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "characters"


def _load_env_local() -> None:
    if os.environ.get("GEMINI_API_KEY"):
        return
    env_path = Path(__file__).resolve().parents[1] / ".env.local"
    if env_path.exists():
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in raw and not raw.strip().startswith("#"):
                k, _, v = raw.partition("=")
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def get_client() -> genai.Client:
    _load_env_local()
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise SystemExit("GEMINI_API_KEY not set (env or template/.env.local).")
    return genai.Client(api_key=key)


SYSTEM = """
You are an expert vector illustrator. You output ONE self-contained, polished,
friendly flat-vector SVG illustration for an educational (edtech) slide deck.

OUTPUT
- Emit ONLY raw SVG: start with `<svg ...>` and end with `</svg>`. No prose, no
  markdown fences, no XML declaration, no DOCTYPE, no comments.

CANVAS
- `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" fill="none">`
- Fully TRANSPARENT background (do NOT draw a background rect).
- Keep the subject centered with ~24px padding from the edges.

STYLE (mandatory)
- Modern flat-vector illustration with gentle depth: use soft <linearGradient>
  and <radialGradient> fills for a smooth, glossy, friendly look.
- Big, rounded, simple shapes. Smooth bezier paths. Rounded stroke line-caps and
  line-joins. Clean, confident, cheerful — like a premium edtech brand mascot.
- Use soft drop shadows via a single subtle <filter> with feGaussianBlur if it
  improves depth (optional). No harsh outlines.
- ABSOLUTELY NO text, letters, numbers, or words anywhere.

PALETTE (use these brand colors)
- primary blue   #0B5FFF  (light #4C80FF, dark #0A44C2)
- teal           #12B5A8  (light #33C6B7, dark #0E9285)
- warm orange    #FF8A3D  (light #FFB055)
- success green  #16A34A
- neutrals: white #FFFFFF, soft ink #0B1A2B, light line #D8E3F5
- Use gradients between related brand colors (e.g. blue->teal) for richness.

QUALITY BAR
- Organize with <defs> for gradients/filters, then grouped <g> layers.
- Make it look intentional and appealing at a glance: clear silhouette, balanced
  composition, expressive but simple. Avoid crude/childish stick shapes.
- Aim for ~40-120 path/shape elements: enough detail to look refined, not noisy.
""".strip()


# Shared character description, repeated for consistency across poses.
NOVA = (
    "The character 'Nova' is a friendly educational mascot: a soft rounded body "
    "shaped like a gentle upward spark/water-drop (symbolizing a rising wave of "
    "learning). Glossy body with a blue->teal vertical gradient, a small glowing "
    "warm-orange flame/spark tuft on top of the head, two big friendly round white "
    "eyes with dark-blue pupils and small white highlights, soft rounded cheeks, a "
    "small warm smile, and two small rounded stub arms. Cute, modern, gender-neutral."
)

SCENES: dict[str, str] = {
    "nova-wave": f"{NOVA} POSE: floating, tilting slightly, raising one stub arm in a friendly waving hello. Warm welcoming expression.",
    "nova-point": f"{NOVA} POSE: turned slightly sideways, one stub arm extended pointing to the right as if presenting a concept. Confident, helpful.",
    "nova-idea": f"{NOVA} POSE: one stub arm raised toward a glowing warm-orange lightbulb floating just above; wide 'aha' eyes.",
    "nova-cheer": f"{NOVA} POSE: both stub arms raised in celebration; a few small blue and teal sparkle/confetti diamonds floating around. Joyful.",
    "nova-checklist": f"{NOVA} SCENE: Nova next to a tall rounded white checklist card (with 3 rounded rows, each with a green rounded check mark, NO text) gesturing at it. Recap vibe.",
    "nova-quiz": f"{NOVA} SCENE: Nova beside a big glossy rounded question-mark glyph in a blue->teal gradient; curious playful expression, a small orange spark of excitement.",
    "nova-practice": f"{NOVA} SCENE: Nova at a sleek rounded laptop; the screen shows abstract colourful rounded code-block bars (NO readable text). Focused and happy.",
    "nova-feedback": f"{NOVA} SCENE: Nova beside a large rounded speech bubble holding a row of 5 stars (4 filled warm-orange, 1 outline). Encouraging expression.",
    "concept-api": "A clean flat-vector edtech diagram-illustration of a REST API flow: a rounded browser/client window on the LEFT, a central rounded server/API cube in the MIDDLE, and a database cylinder on the RIGHT, connected left-to-right by two smooth rounded arrows (request going right, response curving back). Blue/teal/orange brand gradients. Friendly and clear. No readable text.",
    "concept-database": "A clean flat-vector illustration of a database: a stack of 3 rounded glossy cylinder disks with a blue->teal gradient, a soft glow, and 2 small floating rounded record cards with an orange spark. Friendly, modern, tech. No text.",
}


def _clean(svg: str) -> str:
    svg = svg.strip()
    m = re.search(r"<svg[\s\S]*</svg>", svg, re.IGNORECASE)
    if m:
        svg = m.group(0)
    return svg.strip()


def generate_one(client: genai.Client, name: str, desc: str) -> None:
    prompt = (
        f"Create the illustration described below. Remember: ONLY raw <svg>...</svg>, "
        f"transparent background, NO text.\n\nIllustration: {desc}"
    )
    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM,
            temperature=0.5,
        ),
    )
    svg = _clean(resp.text or "")
    if not svg.lower().startswith("<svg"):
        raise RuntimeError("model did not return SVG")
    out = ASSET_DIR / f"{name}.svg"
    out.write_text(svg, encoding="utf-8")
    print(f"  ✅ {name}.svg ({len(svg)} chars)")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    client = get_client()
    only = sys.argv[1] if len(sys.argv) > 1 else None
    if only and only not in SCENES:
        raise SystemExit(f"Unknown scene '{only}'. Options: {', '.join(SCENES)}")
    items = {only: SCENES[only]} if only else SCENES
    print(f"🎨 Generating {len(items)} SVG(s) → {ASSET_DIR}")
    ok = fail = 0
    for name, desc in items.items():
        print(f"  [{name}] …")
        try:
            generate_one(client, name, desc)
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ⚠️  {name}: {str(exc)[:120]}")
            fail += 1
    print(f"\nDone: {ok} ok, {fail} failed.")


if __name__ == "__main__":
    main()
