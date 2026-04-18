# StudioLee Studio Dashboard — Claude Skill Doc

> This document tells Claude how the dashboard works and how to update it whenever new content is generated.

## Overview

StudioLee Studio is a static HTML/CSS/JS dashboard deployed on Vercel that displays all AI-generated content (images, videos, personas, projects) from two source repos. It tracks every generation with download buttons and cost tracking.

- **Live URL:** https://studiolee-studio.vercel.app
- **GitHub:** https://github.com/StudioLee-cmd/studiolee-studio
- **Vercel project:** `prj_CFblD77kK5zcp80Gf2H0QaYyMwEn` (team `digitalstudiolee`)

## Architecture

```
studiolee-studio/
  index.html              ← SPA shell (never changes)
  css/dashboard.css       ← Dark theme styles (rarely changes)
  js/app.js               ← Router, views, components (rarely changes)
  data/registry.json      ← ALL content data (UPDATE THIS on every generation)
```

The dashboard is a single-page app with hash-based routing (`#/projects`, `#/personas/metal-girl`, etc.). All content references point to raw GitHub URLs from two source repos:

| Repo | Base URL | Contains |
|---|---|---|
| `seedance-content` | `https://raw.githubusercontent.com/StudioLee-cmd/seedance-content/main` | Persona avatars, Instagram posts, niche backgrounds, test videos, Tim Lee images |
| `seedance-studio` | `https://raw.githubusercontent.com/StudioLee-cmd/seedance-studio/main` | Project files: scene images, scene videos, assets, project configs |

## Pricing Model

All costs auto-calculate in the dashboard from the file counts in `registry.json`:

| Type | Cost |
|---|---|
| Image (any) | **$0.04** per image |
| Video | **$0.10** per second |
| Failed generation | Same cost — still counts. Track in `spending.totalUsd` |

The `spending.totalUsd` field is the REAL total spent on Kie AI. The dashboard auto-calculates per-project and per-persona costs from their files and shows the difference as "Failed / Retries."

**EUR conversion:** `meta.usdToEur` (currently `0.88`). Update if rate changes significantly.

---

## How to Update registry.json

### When generating a NEW IMAGE (persona post, scene frame, asset, etc.)

1. **Push the image** to the correct source repo (`seedance-content` or `seedance-studio`)
2. **Update `registry.json`** — add the file path to the appropriate section
3. **Update `spending.totalUsd`** — add $0.04 per image generated (including failures)
4. **Update `spending.totalCredits`** — add 8 credits per image ($0.04 = 8 credits at 1000cr/$5)
5. **Update `spending.breakdown`** — adjust the relevant category
6. **Push `registry.json`** to `studiolee-studio` repo
7. Vercel auto-deploys

### When generating a NEW VIDEO

1. **Push the video** to the source repo
2. **Add to `registry.json`**:
   - If it's a persona test video: add to the `videos` array
   - If it's a project scene video: add to the scene's `videos` array
   - If it's a chaos/test clip: add to the project's `chaosTests` array
3. **Set the status**: `"in-review"` by default. Change to `"approved"` or `"rejected"` after review.
4. **Update spending**: add $0.10 × seconds to `totalUsd`, 20 credits per second to `totalCredits`
5. **Push and deploy**

### When creating a NEW PERSONA

Add to the `personas` array:

```json
{
  "id": "niche-gender",           // e.g. "metal-girl" — used in URLs
  "file": "NN_niche_gender",      // e.g. "01_metal_girl" — filename prefix
  "name": "Display Name",
  "handle": "@handle",
  "niche": "Niche",               // Must match existing niche or create new filter
  "bio": "Short bio",
  "avatar": "personas/NN_niche_gender.png",
  "posts": [                      // Array of post image paths
    "instagram/person/NN_niche_gender/p1.jpg"
  ],
  "nicheImages": "instagram/niche" // Shared niche background folder
}
```

### When creating a NEW PROJECT

Add to the `projects` array:

```json
{
  "id": "slug-name",
  "title": "Project Title",
  "status": "phase-1-assets",
  "statusLabel": "Phase 1 — Assets",
  "duration": "~60s",
  "format": "9:16",
  "style": "Style description",
  "thumbnail": "path/to/thumb.png",
  "thumbnailRepo": "content",       // "content" or "studio"
  "story": "Synopsis text",
  "characters": [
    { "name": "Name", "role": "Main", "persona": "persona-id" }
  ],
  "assets": [
    { "name": "Asset Name", "file": "projects/slug/assets/file.jpg" }
  ],
  "scenes": [],
  "chaosTests": []
}
```

### When adding a SCENE to a project

Each scene in the `scenes` array:

```json
{
  "id": 1,
  "name": "Scene Name",
  "dur": "6s",
  "status": "not-started",        // not-started → draft → in-review → approved
  "desc": "Scene description",
  "images": [                      // Every image generated for this scene
    { "file": "projects/slug/scene-01/first_frame.jpg", "label": "First frame" },
    { "file": "projects/slug/scene-01/first_frame_v2.jpg", "label": "First v2" }
  ],
  "videos": [                      // Every video take, including rejected
    { "file": "projects/slug/videos/scene01_v1.mp4", "label": "v1", "status": "rejected", "dur": 6 },
    { "file": "projects/slug/videos/scene01_v2.mp4", "label": "v2 (approved)", "status": "approved", "dur": 6 }
  ],
  "variants": {                    // Optional: alternative approaches to the scene
    "1a": {
      "name": "Variant A",
      "images": [...],
      "videos": [...]
    }
  },
  "approved": "projects/slug/approved/scene-01.jpg"  // Optional: approved frame
}
```

**IMPORTANT:** Include ALL versions (v1, v2, v3, v7, etc.) and ALL takes — both approved and rejected. This is how cost tracking works. Every generated file costs money whether it was used or not.

### When a video/scene is APPROVED or REJECTED

Find the item in `registry.json` and change its `status` field:

```
"status": "approved"   ← Green badge
"status": "rejected"   ← Hidden in default view, still counts for cost
"status": "in-review"  ← Yellow badge
"status": "draft"      ← Gray badge
"status": "not-started" ← Gray badge
```

Also update the scene's top-level `status` when its final video is approved.

### When updating SPENDING TOTALS

The `spending` section must always reflect reality:

```json
"spending": {
  "totalCredits": 6000,     // REAL total credits consumed on Kie AI
  "totalUsd": 30.00,        // REAL total USD spent (totalCredits × $5/1000)
  "rate": "1000 credits = $5 USD",
  "breakdown": {
    "personas": { "usd": 9.64, "desc": "description" },
    "project-slug": { "usd": 11.28, "desc": "description" },
    "failed-retries": { "usd": 8.72, "desc": "description" }
  }
}
```

When adding new spend:
1. Add the cost to `totalUsd`
2. Add the credits to `totalCredits` (usd × 200 = credits)
3. Update the relevant `breakdown` entry
4. If the generation failed, increase the `failed-retries` amount

---

## Dashboard Pages

| Route | View | What it shows |
|---|---|---|
| `#/` | Home | Stats (projects, personas, videos, images, credits), active projects, recent videos, persona preview |
| `#/projects` | Projects | Grid of all projects with status badges |
| `#/projects/:slug` | Project Detail | Hero, characters, assets, cost breakdown, all scenes with every image/video version, chaos clips |
| `#/personas` | Personas | Filterable grid by niche |
| `#/personas/:slug` | Persona Detail | Avatar, bio, spending badge, tabs (posts / niche collection / videos) |
| `#/videos` | Videos | All videos with cost tags |
| `#/images` | Images | Multi-filter: category, niche, character, status. Includes scene images |
| `#/spending` | Spending | Total breakdown, per-project table, per-persona table, failed/retries |

## Source Repo File Conventions

### seedance-content (persona assets)
```
personas/NN_niche_gender.png           ← Avatar (e.g. 01_metal_girl.png)
instagram/person/NN_niche_gender/pN.jpg ← Posts (p1.jpg, p2.jpg, p3.jpg, etc.)
instagram/niche/NN.jpg                  ← Niche backgrounds (01.jpg through 10.jpg)
videos/descriptive_name.mp4             ← Test videos
timleetv/filename.jpg                   ← Tim Lee character images
```

### seedance-studio (project files)
```
projects/slug/assets/name.jpg           ← Props, references
projects/slug/scene-NN/filename.jpg     ← Scene images (concepts, frames, versions)
projects/slug/videos/sceneNN_vN.mp4     ← Scene video takes
projects/slug/approved/scene-NN.jpg     ← Approved frames
```

## Never Do

- Never save generated content to local disk — push directly to GitHub
- Never update the dashboard HTML/CSS/JS unless the structure changes — only update `registry.json`
- Never remove rejected items from the registry — they track real cost
- Never guess spending amounts — calculate from `$0.04/image` + `$0.10/second`
- Never batch multiple articles/videos without updating the registry after each one

## Quick Reference: Adding a Single Generated Item

**Image pushed to GitHub? Update registry.json like this:**

1. Add file path to the correct array (persona posts, scene images, assets)
2. `spending.totalUsd += 0.04`
3. `spending.totalCredits += 8`
4. `spending.breakdown.[category].usd += 0.04`
5. `git add data/registry.json && git commit && git push`

**Video pushed to GitHub? Update registry.json like this:**

1. Add to videos array or scene videos with `{ "file": "...", "label": "vN", "status": "in-review", "dur": SECONDS }`
2. `spending.totalUsd += (seconds × 0.10)`
3. `spending.totalCredits += (seconds × 20)`
4. `spending.breakdown.[category].usd += (seconds × 0.10)`
5. `git add data/registry.json && git commit && git push`
