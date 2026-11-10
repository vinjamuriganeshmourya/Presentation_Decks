#!/usr/bin/env python3
"""
generate_characters.py
======================

Generates the original "NxtWave Evolve" character + spot-illustration set for
the web-slides template using Google's Gemini image model. Modeled on the
working pattern in ccbp-frontend-interview-kit/python/scripts/generate_images.py.

Every prompt repeats the SAME detailed character sheet ("Nova") so the mascot
looks consistent across scenes (image models are stateless between calls).

Output: PNGs in  template/public/assets/characters/<name>.png

Requires a Gemini API key with image-generation access. Provide it via either:
    export GEMINI_API_KEY="..."
  or a gitignored file  template/.env.local  containing:
    GEMINI_API_KEY=...

Usage:
    python3 scripts/generate_characters.py            # generate all
    python3 scripts/generate_characters.py nova-wave  # generate one by name
"""

import os
import sys
from pathlib import Path

from google import genai
from google.genai import types

# ---------------------------------------------------------------- config
IMAGE_MODEL = "gemini-2.5-flash-image"  # per the reference pipeline
ASSET_DIR = Path(__file__).resolve().parents[1] / "public" / "assets" / "characters"

# ---------------------------------------------------------------- api key
def _load_env_local() -> None:
    if os.environ.get("GEMINI_API_KEY"):
        return
    env_path = Path(__file__).resolve().parents[1] / ".env.local"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def get_client() -> genai.Client:
    _load_env_local()
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise SystemExit(
            "GEMINI_API_KEY not set. Export it or add it to template/.env.local"
        )
    return genai.Client(api_key=key)


# ---------------------------------------------------------------- prompts
# Shared, verbatim character sheet — repeated in every scene for consistency.
NOVA = (
    "Nova is a friendly educational mascot: a soft, rounded character shaped "
    "like a gentle upward spark/arrow, symbolizing learning and growth. Glossy "
    "electric-blue body (#0B5FFF) with smooth teal (#12B5A8) accents and a small "
    "warm-orange (#FF8A3D) energy flame/spark on top of the head. Big friendly "
    "rounded eyes, soft rounded cheeks, a small warm smile, tiny rounded arms. "
    "Cute, approachable, modern, gender-neutral, tech-forward but warm."
)

STYLE = (
    " Modern flat-vector illustration with subtle soft gradients and gentle depth, "
    "clean crisp edges, bright but professional educational edtech aesthetic, "
    "consistent lighting, centered composition, generous padding. "
    "PLAIN FULLY-TRANSPARENT BACKGROUND (alpha), no scenery, no floor, no shadow "
    "plate. ABSOLUTELY NO text, words, letters, numbers, or labels anywhere in "
    "the image."
)

SCENES: dict[str, str] = {
    # --- mascot poses (slide chrome) ---
    "nova-wave": (
        f"{NOVA} Pose: floating and waving one arm in a friendly hello, head "
        "slightly tilted, eyes bright and welcoming, cheerful expression."
    ),
    "nova-point": (
        f"{NOVA} Pose: turned slightly to the side, one arm extended pointing "
        "forward/right as if presenting or explaining a concept, confident helpful look."
    ),
    "nova-idea": (
        f"{NOVA} Pose: one arm raised with a glowing warm-orange lightbulb floating "
        "just above the hand, eyes wide with an 'aha!' insight expression."
    ),
    "nova-cheer": (
        f"{NOVA} Pose: both arms raised in celebration, joyful expression, a few "
        "small blue and teal confetti/sparkle shapes floating around (no text)."
    ),
    # --- spot scenes (slide chrome) ---
    "nova-checklist": (
        f"{NOVA} Scene: Nova standing beside a large rounded checklist card with "
        "three blank rounded check rows and green check marks (no text on the card), "
        "gesturing at it as if recapping key points."
    ),
    "nova-quiz": (
        f"{NOVA} Scene: Nova beside a large friendly rounded question-mark symbol, "
        "curious and playful expression, a small orange spark of excitement (no text)."
    ),
    "nova-practice": (
        f"{NOVA} Scene: Nova sitting/floating at a sleek rounded laptop showing "
        "abstract colourful code blocks and shapes on screen (NO readable text), "
        "focused and happy, coding/practicing."
    ),
    "nova-feedback": (
        f"{NOVA} Scene: Nova beside a large rounded speech bubble containing five "
        "star shapes (four filled warm-orange, one outline), friendly encouraging "
        "expression (no text)."
    ),
    # --- concept illustrations (sample backend-dev deck content) ---
    "concept-api": (
        "A clean modern flat-vector concept illustration of a REST API: a rounded "
        "client device (browser window) on the left connected by a labelled-free "
        "arrow to a central rounded server/API block, which connects to a database "
        "cylinder on the right. Electric-blue (#0B5FFF), teal (#12B5A8) and "
        "warm-orange (#FF8A3D) palette. Request/response arrows shown as simple "
        "rounded arrows. Friendly and diagrammatic."
    ),
    "concept-database": (
        "A clean modern flat-vector concept illustration of a database: a stack of "
        "rounded cylinder disks glowing softly in electric-blue and teal, with a "
        "few floating rounded data/record cards and a small warm-orange spark. "
        "Friendly, educational, tech aesthetic."
    ),
}


def generate_one(client: genai.Client, name: str, prompt: str) -> None:
    full = prompt + STYLE
    resp = client.models.generate_content(
        model=IMAGE_MODEL,
        contents=full,
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    for cand in (resp.candidates or []):
        content = getattr(cand, "content", None)
        for part in (getattr(content, "parts", None) or []):
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                out = ASSET_DIR / f"{name}.png"
                out.write_bytes(inline.data)
                print(f"  ✅ {out.relative_to(ASSET_DIR.parents[2])}")
                return
    raise RuntimeError("model returned no image data")


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    client = get_client()
    only = sys.argv[1] if len(sys.argv) > 1 else None
    items = {only: SCENES[only]} if only else SCENES
    if only and only not in SCENES:
        raise SystemExit(f"Unknown scene '{only}'. Options: {', '.join(SCENES)}")
    print(f"🎨 Generating {len(items)} character asset(s) → {ASSET_DIR}")
    ok = fail = 0
    for name, prompt in items.items():
        print(f"  [{name}] generating…")
        try:
            generate_one(client, name, prompt)
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ⚠️  {name} failed: {exc}")
            fail += 1
    print(f"\nDone: {ok} generated, {fail} failed.")


if __name__ == "__main__":
    main()
