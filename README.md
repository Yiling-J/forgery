<div align="center">
  <img src="public/logo-large.webp" alt="Forgery Logo" width="200" height="200" />
  <h1>Forgery</h1>
  <p><strong>Your personal AI studio for character creation and outfit fitting.</strong></p>
</div>

---

## About

Forgery is a local-first application designed to help you generate, manage, and refine AI-generated characters and assets. With a focus on creative freedom and ease of use, Forgery provides a dedicated "Fitting Room" where you can experiment with different looks, poses, and expressions for your characters.

## Features

- **Character Management**: Create and organize your AI characters.
- **Equipment Library**: Manage outfits, accessories, and other equipment assets.
- **Fitting Room**: A powerful generation interface to mix and match characters with equipment, poses, and expressions.
- **Pose & Expression Control**: Fine-tune your character's look with a library of poses and facial expressions.
- **Local & Private**: All data and generated images are stored locally on your machine.
- **Flexible AI Integration**: seamlessly switch between Google Gemini and OpenAI models for different stages of the generation pipeline.

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
