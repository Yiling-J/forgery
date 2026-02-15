<div align="center">
  <img src="public/logo-large.webp" alt="Forgery Logo" width="200" height="200" />
  <h1>Forgery</h1>
  <p><strong>Your personal AI studio for equipment extraction and character look generation.</strong></p>
</div>

---

## About

Forgery is a local-first application designed to help you build a digital wardrobe and generate stunning new looks for your characters. It specializes in two key workflows: **extracting equipment from existing images** and **fitting that equipment onto your characters**.

Unlike traditional character generators, Forgery focuses on consistency and customization. You start by uploading a base image for your character, then use the powerful "Fitting Room" to generate new variations (Looks) by mixing and matching extracted equipment, poses, and expressions.

## Features

- **Equipment Extraction**: Analyze images to identify and extract equipment (outfits, weapons, accessories) into your library.
- **Look Generation**: Generate new images of your character wearing selected equipment.
- **Character Management**: Organize your characters and their base reference images.
- **Fitting Room**: The core studio interface for combining characters, equipment, poses, and expressions into new Looks.
- **Pose & Expression Control**: Fine-tune your generation with a library of poses and facial expressions.
- **Local & Private**: All data, including your image library and generated results, is stored locally on your machine.
- **Flexible AI Integration**: seamlessly switch between Google Gemini and OpenAI models for different stages of the extraction and generation pipeline.

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or later)
- **OR** [Docker](https://www.docker.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/forgery.git
cd forgery
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Initialize the Database

Forgery uses a local SQLite database. Run the following command to set up the schema:

```bash
bun run prisma migrate dev
```

### 4. Run the Application

Start the development server:

```bash
bun run dev
```

Open your browser and navigate to `http://localhost:3000`.

## Running with Docker

You can also run Forgery using Docker Compose.

```bash
docker compose up -d
```

The application will be available at `http://localhost:3000`.
Data (database and generated files) will be persisted in the `./data` directory on your host machine.

## Configuration

Forgery requires API keys for AI generation services (Google Gemini and/or OpenAI).

1.  Launch the application and go to the **Settings** page (accessed via the sidebar).
2.  Enter your **Google API Key** and/or **OpenAI API Key**.
3.  Configure your preferred models for text and image generation.
4.  (Optional) Customize the "Extraction Flow" to choose specific models for different steps of the asset analysis and generation process.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Backend Framework**: [Hono](https://hono.dev)
- **Frontend Library**: [React](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [Shadcn UI](https://ui.shadcn.com)
- **Database**: SQLite with [Prisma](https://www.prisma.io)
