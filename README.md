# Forgery

> Build, remix, and re-style characters with AI — extract equipment from images, store them in a library, and apply equipment + pose/expression to generate fresh looks.

[![build-badge](https://img.shields.io/badge/build-wip-yellow)](https://github.com/yourname/forgery) [![license-mit](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Forge characters, not chaos. `forgery` helps you extract equipments (props, clothing, accessories) from character images, save them as reusable items in a DB, and then generate new character *looks* by applying selected equipments + pose/expression controls using AI image generation.

---

## Why Forgery?

* **Modular Assets**: Turn screenshots, cosplay photos, or movie stills into modular assets.
* **Rapid Prototyping**: Quickly prototype many character looks by mixing and matching equipments.
* **Fine-Grained Control**: Add expression & pose control to generated looks for richer results.
* **Local-First & Private**: All data, including your image library and generated results, is stored locally on your machine.
* **Flexible AI Integration**: Seamlessly switch between Google Gemini and OpenAI models for different stages of the pipeline.

---

## Highlights

* 🔍 **Equipment extraction** — detect & crop equipment regions, normalize and store metadata.
* 🧩 **Equipment library** — structured DB with visual preview, masks, tags, anchors, and compatibility hints.
* 🖼️ **Apply equipments** — generate a new image of a character wearing selected equipments.
* 🎭 **Pose & expression controls** — specify expression and pose priors to steer generation.
* 🔌 **Model-agnostic** — plug in your favorite segmentation or image-generation models (OpenAI, Gemini supported out-of-the-box).
* ♻️ **Open-source** — clear data model & contribution guidelines.

---

## How It Works

1. **Extract**: Upload a character image. Forgery analyzes it to identify and extract equipment (outfits, weapons, accessories).
2. **Refine**: Review the extracted assets, refine their masks, and save them to your library.
3. **Create Character**: Upload a base portrait for your character.
4. **Fitting Room**: Combine your character with selected equipment, choose a pose, and set an expression.
5. **Generate**: Watch as Forgery generates a new Look for your character.

---

## Core Concepts

* **Equipment** — any wearable or attachable asset extracted from images (hat, glasses, sword, jacket). Stored with mask, anchor points, metadata.
* **Character** — a user-created profile representing a base person/portrait used as the generation canvas.
* **Look** — a generated image (or variant) that applies a set of equipments to a character, optionally altered by pose/expression.
* **Extraction** — computer vision process that detects equipment regions and outputs masks, crops, and suggested anchors.
* **Application/Generation** — image generation pipeline that composes character + selected equipments + conditioning (pose/expression) into a final render.

---

## Getting Started

### Requirements

* [Bun](https://bun.sh) (v1.0.0 or later)
* **OR** [Docker](https://www.docker.com/)
* API Keys for OpenAI or Google Gemini (for AI generation)

### Local Quickstart

```bash
git clone https://github.com/yourname/forgery.git
cd forgery
bun install
bun run prisma migrate dev  # Initialize local SQLite DB
bun run dev
# server available at http://localhost:3000
```

### Docker Quickstart

```bash
docker compose up -d
# server available at http://localhost:3000
```

---

## Configuration

Forgery requires API keys for AI generation services (Google Gemini and/or OpenAI).

1.  Launch the application and go to the **Settings** page (accessed via the sidebar).
2.  Enter your **Google API Key** and/or **OpenAI API Key**.
3.  Configure your preferred models for text and image generation.
4.  (Optional) Customize the "Extraction Flow" to choose specific models for different steps of the asset analysis and generation process.

---

## Architecture Overview

A modular pipeline built on a modern stack:

1. **Frontend** (React + Shadcn UI + Tailwind)
   * Upload UI, equipment library browser, look composer (Fitting Room).
2. **API Server** (Hono on Bun)
   * REST API for extraction, equipment CRUD, character CRUD, generation.
3. **Extraction Service**
   * Orchestrates AI models (OpenAI/Gemini) to analyze images and generate masks.
4. **Asset Store**
   * Local file system (`data/files`) for storing optimized WebP images.
5. **Generation Service**
   * Composes prompts and conditioning for image generation models.
6. **DB** (SQLite + Prisma)
   * Stores metadata, relationships, settings, and generation history.

---

## Contributing

Love forks, fixes, and wild experiments.

* Run tests: `bun test`
* Lint code: `bun run lint`
* Create clear PRs with reproducible steps and small commits.

---

## License

[MIT](./LICENSE)
