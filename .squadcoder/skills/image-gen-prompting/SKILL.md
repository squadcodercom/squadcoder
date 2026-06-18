---
name: sc:image-gen-prompting
description: "Craft effective text-to-image prompts for AI generators (Higgsfield, Midjourney, DALL·E/GPT-Image, Stable Diffusion, Flux). Subject + style + composition + lighting structure, negative prompts, aspect ratios, model-specific tips, and Hebrew→English prompt translation. Activate for: generate image, AI art, product shots, ad creatives, thumbnails, prompt engineering, יצירת תמונה, פרומפט."
argument-hint: "[generator] [what to create]"
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# AI Image Prompting

Turn a request into a precise, generator-ready prompt. A good prompt is **specific and ordered**, not a pile of adjectives.

## Prompt formula (in this order)
`[subject + action] , [environment/context] , [composition/shot] , [style/medium] , [lighting] , [color/mood] , [quality/render] , [params]`

Example: *"a ceramic coffee mug on a marble countertop, morning kitchen, close-up product shot, soft natural window light from the left, warm muted palette, photorealistic, shallow depth of field --ar 4:5"*

## Levers (pick deliberately)
- **Shot**: close-up / macro / medium / wide / aerial / flat-lay / eye-level.
- **Lens/feel**: 35mm, 85mm portrait, tilt-shift, bokeh, long exposure.
- **Style**: photorealistic, 3D render, isometric, watercolor, line art, brand-flat, cyberpunk, claymation.
- **Lighting**: soft natural, golden hour, studio softbox, rim light, neon, chiaroscuro.
- **Mood/color**: warm/cool, pastel, high-contrast, monochrome, on-brand hex.

## Negative prompts (SD/Flux)
List what to avoid: `extra fingers, deformed hands, text, watermark, blurry, low-res, jpeg artifacts, duplicate`.

## Aspect ratios by use
- Square 1:1 (IG feed, avatars) · Portrait 4:5 (IG/FB feed) · 9:16 (Stories/Reels/TikTok) · 16:9 (YouTube/web hero) · 1.91:1 (link previews/ads).

## Model-specific notes
- **Midjourney**: terse, comma-separated; use `--ar`, `--s` (stylize), `--c` (chaos), `--no` for negatives. Quality over sentence grammar.
- **DALL·E / GPT-Image**: full natural-language sentences; great at following instructions + text-in-image; describe layout explicitly.
- **Stable Diffusion / Flux**: weighted tokens `(keyword:1.3)`, explicit negative prompt, set steps/CFG; good for control + LoRAs.
- **Higgsfield**: motion/video-oriented — specify camera move (push-in, orbit, pan), duration, and a clear single subject; keep scenes simple.

## Product / ad creatives (most common ask)
- Isolate the product, name the surface + background, specify lighting direction, leave **negative space for copy** if it's an ad.
- Keep brand colors; request a clean composition; generate 3–4 variations and pick.

## Hebrew → prompt
- Most generators perform best in **English** — translate the Hebrew brief to a precise English prompt, but keep any **Hebrew text that must appear in-image** quoted exactly (and prefer DALL·E/GPT-Image for legible text).
- Note RTL when the layout includes Hebrew copy.

## Output
Give the **ready-to-paste prompt** + (for SD/Flux) a negative prompt + suggested aspect ratio + 1 line on what to tweak if the first result misses.
