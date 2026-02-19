<div align="center">
  <img src="public/logo-large.webp" alt="Forgery Logo" width="200" height="200" />
  <h1>Forgery</h1>
  <p><strong>Build, remix, and re-style characters with AI</strong></p>
</div>

Forge characters, not chaos. Forgery helps you extract equipments (props, clothing, accessories) from character images, save them as reusable items, and then generate new character _looks_ by applying selected equipments + pose/expression controls using AI image generation.



## Why Forgery?

- **Modular Assets**: Turn screenshots, cosplay photos, or movie stills into modular assets.
- **Rapid Prototyping**: Quickly prototype many character looks by mixing and matching equipments.
- **Fine-Grained Control**: Add expression & pose control to generated looks for richer results.



## How It Works

1. **Extractor**: Upload an image. Forgery analyzes it to identify and extract equipment (outfits, weapons, accessories).
2. **Create Character**: Upload a base portrait for your character.
3. **Fitting Room**: Combine your character with selected equipment, choose a pose, and set an expression.
4. **Generate**: Watch as Forgery generates a new Look for your character.



## Getting Started

### Requirements

- [Bun](https://bun.sh)
- **OR** [Docker](https://www.docker.com/)
- API Keys for OpenAI or Google Gemini

### Local Quickstart

```bash
git clone https://github.com/yourname/forgery.git
cd forgery
bun install
bun run prisma migrate dev  # Initialize local SQLite DB
bun run dev
# server available at http://localhost:3000
```

### Docker Quickstart (Compose)

If you have cloned the repository or have the `docker-compose.yml` file:

```bash
docker compose up -d
# server available at http://localhost:3000
```

### Docker Quickstart (Standalone)

You can run the latest version directly without cloning the repository:

```bash
mkdir -p data
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name forgery \
  yilingj/forgery:latest
# server available at http://localhost:3000
```



## Configuration

Forgery requires API keys for AI generation services (Google Gemini and/or OpenAI).

1.  Launch the application and go to the **Settings** page (accessed via the sidebar).
2.  Enter your **Google API Key** and/or **OpenAI API Key**.
3.  Configure your preferred models for text and image generation.


## Model Recommendations

For optimal results in both equipment extraction and high-fidelity character generation, it is highly recommended to use the **Nana Banana Pro** model. This model provides superior precision for isolating modular assets and ensures the most consistent "looks" when remixing styles and accessories.

For the Refine step, the standard Nano Banana model is typically sufficient to handle iterative adjustments and polish without the need for the Pro-level tier.



## Data Backup

Your data is stored locally in data folder. To back up your library, character assets, and configuration, simply copy the data folder.

To restore, place the folder back in the root directory (or your Docker volume path) before starting the application.



## Architecture Overview

A modular pipeline built on a modern stack:

1. **Frontend** (React + Shadcn UI + Tailwind)
   - Upload UI, equipment library browser, look composer (Fitting Room).
2. **API Server** (Hono on Bun)
   - REST API for extraction, equipment CRUD, character CRUD, generation.
3. **Extraction Service**
   - Orchestrates AI models (OpenAI/Gemini) to analyze images and generate masks.
4. **Asset Store**
   - Local file system (`data/files`) for storing optimized WebP images.
5. **DB** (SQLite + Prisma)
   - Stores metadata, relationships, settings, and generation history.



## License

[MIT](./LICENSE)
