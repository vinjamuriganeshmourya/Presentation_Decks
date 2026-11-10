#!/usr/bin/env python3
"""
gen_mascot.py — generate a professional AI mascot image via Gemini image models,
with in-script backoff (429) and model fallback. NOT a shell sleep (allowed).

Usage:
  python3 scripts/gen_mascot.py <name> "<prompt>" [reference_image.png]
Saves: public/assets/characters/<name>.png
"""
import os, sys, time
from pathlib import Path
from google import genai
from google.genai import types

ASSET = Path(__file__).resolve().parents[1] / "public" / "assets" / "characters"
GEMINI_IMAGE_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image",
    "gemini-3-pro-image",
]
IMAGEN_MODELS = ["imagen-4.0-fast-generate-001", "imagen-4.0-generate-001"]

STYLE = (
    " Style: premium mascot-logo quality, modern rounded flat-3D illustration with "
    "soft gradients, gentle studio lighting, soft rim light and a soft contact shadow "
    "for depth, clean crisp shapes, friendly and professional. Brand palette: electric "
    "blue #0B5FFF, teal #12B5A8, warm orange #FF8A3D accent, on nothing else. Centered, "
    "full body, generous padding. PLAIN WHITE BACKGROUND. Absolutely NO text, letters, "
    "numbers or watermark."
)

def load_key():
    if os.environ.get("GEMINI_API_KEY"):
        return
    for raw in (Path(__file__).resolve().parents[1] / ".env.local").read_text().splitlines():
        if "=" in raw and not raw.strip().startswith("#"):
            k, _, v = raw.partition("="); os.environ.setdefault(k.strip(), v.strip())

def extract(resp):
    for c in (resp.candidates or []):
        for p in (getattr(c.content, "parts", None) or []):
            inl = getattr(p, "inline_data", None)
            if inl and getattr(inl, "data", None):
                return inl.data
    return None

def gen_gemini(client, model, prompt, ref_bytes):
    contents = [prompt]
    if ref_bytes:
        contents = [types.Part.from_bytes(data=ref_bytes, mime_type="image/png"), prompt]
    resp = client.models.generate_content(
        model=model, contents=contents,
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    return extract(resp)

def gen_imagen(client, model, prompt):
    resp = client.models.generate_images(
        model=model, prompt=prompt,
        config=types.GenerateImagesConfig(number_of_images=1),
    )
    imgs = getattr(resp, "generated_images", None) or []
    if imgs:
        return imgs[0].image.image_bytes
    return None

def generate(client, prompt, ref_bytes=None):
    full = prompt + STYLE
    for model in GEMINI_IMAGE_MODELS:
        for attempt in range(3):
            try:
                data = gen_gemini(client, model, full, ref_bytes)
                if data:
                    print(f"    ✓ via {model}")
                    return data
                print(f"    {model}: no image, next")
                break
            except Exception as e:
                msg = str(e)
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    wait = 12 * (attempt + 1)
                    print(f"    {model}: 429, backoff {wait}s (try {attempt+1}/3)")
                    time.sleep(wait)
                    continue
                if "404" in msg or "NOT_FOUND" in msg:
                    print(f"    {model}: not available, next model")
                    break
                print(f"    {model}: {msg[:100]}")
                break
    for model in IMAGEN_MODELS:
        for attempt in range(2):
            try:
                data = gen_imagen(client, model, full)
                if data:
                    print(f"    ✓ via {model}")
                    return data
                break
            except Exception as e:
                msg = str(e)
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    wait = 12 * (attempt + 1)
                    print(f"    {model}: 429, backoff {wait}s")
                    time.sleep(wait)
                    continue
                print(f"    {model}: {msg[:100]}")
                break
    raise RuntimeError("all image models failed / exhausted")

def main():
    name = sys.argv[1]
    prompt = sys.argv[2]
    ref = sys.argv[3] if len(sys.argv) > 3 else None
    ref_bytes = Path(ref).read_bytes() if ref and Path(ref).exists() else None
    load_key()
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    ASSET.mkdir(parents=True, exist_ok=True)
    print(f"🎨 generating '{name}'…")
    data = generate(client, prompt, ref_bytes)
    out = ASSET / f"{name}.png"
    out.write_bytes(data)
    print(f"saved {out}")

if __name__ == "__main__":
    main()
