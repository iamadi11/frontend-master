# Frontend System Design Learning Platform

A backend-driven, CMS-powered learning platform for Frontend System Design. Built with Next.js, Payload CMS, and MongoDB. Each topic includes detailed Theory sections and interactive Practice demos with teaching-first animations.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Payload CMS v3** (admin panel integrated)
- **MongoDB** (via Payload's MongoDB adapter)
- **PWA Support** (Serwist service worker)
- **UI Utilities**: next-themes, framer-motion, clsx, tailwind-merge, lucide-react, zod

## Local Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   - `DATABASE_URL` - MongoDB connection string
   - `PAYLOAD_SECRET` - Secret key for Payload CMS (generate a random string)
   - `NEXT_PUBLIC_SITE_URL` - Your site URL (optional, defaults to http://localhost:3000)

3. **Run development server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with sample content (creates sample Resource, Page, and Resource 1 Topic)

## Admin Panel & Content Management

The admin panel is available at `/admin`. Here you can:

1. **Create a user account** (first time setup):
   - Navigate to http://localhost:3000/admin
   - Create your first admin user

2. **Manage content:**
   - **Pages**: Create pages with title, slug, status (draft/published), and rich text content
   - **Resources**: Create resources with title, resource number, summary, body, and references
   - **Topics**: Create learning topics with Theory and Practice sections
     - Theory: Rich text content with references
     - Practice: Interactive demo configuration, guided steps, and hands-on tasks

3. **Content flow:**
   - Content created in Payload CMS → Stored in MongoDB → Rendered by Next.js routes
   - Pages are accessible at `/{slug}` (only published pages)
   - Resources are listed at `/resources` and accessible at `/resources/{number}`
   - Topics are accessible at `/topics/{slug}` with Theory and Practice tabs

## Project Structure

```
src/
  app/
    (site)/              # Public website routes
      page.tsx           # Homepage
      resources/         # Resources listing and detail pages
      topics/            # Topic pages with Theory/Practice tabs
        [slug]/
          page.tsx       # Topic page (server)
          TopicPageClient.tsx  # Topic page (client with tabs)
          loading.tsx    # Loading state
          not-found.tsx  # Not found state
      [...slug]/         # Dynamic page routes by slug
    layout.tsx           # Root layout with theme + motion providers
    manifest.ts          # PWA manifest
    sw.ts                # Service worker
    offline/             # Offline fallback page
  lib/
    payload.ts           # Payload client initialization (server-only)
    content.ts           # Content access functions (server-only)
    utils.ts             # Utility functions
  components/
    motion/              # Motion preferences system
      MotionPrefsProvider.tsx  # Motion preferences context
      ReduceMotionToggle.tsx   # UI toggle for reduced motion
    demo/                # Practice demo infrastructure
      demoSchema.ts      # Zod schema for demo configs
      DemoShell.tsx      # Demo layout (controls + visualization + log)
      EventLog.tsx       # Event log component
      Spotlight.tsx     # Focus highlighting component
      demos/             # Individual demo implementations
        RequirementsToArchitectureDemo.tsx  # Resource 1 demo
    RichTextRenderer.tsx # Lexical rich text renderer
    SiteHeader.tsx       # Site header with navigation
    theme-provider.tsx   # Theme context provider
    motion-wrapper.tsx  # Route transition wrapper
docs/
  _source/              # Dev-only PDF reference (gitignored)
  curriculum-index.md   # Lightweight curriculum index
scripts/
  seed.mjs              # Database seeding script
```

## Deployment to Vercel

1. **Push your code to a Git repository**

2. **Connect to Vercel:**
   - Import your repository in Vercel
   - Vercel will auto-detect Next.js

3. **Set environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `DATABASE_URL` - Your MongoDB connection string (from MongoDB Atlas or your MongoDB provider)
     - `PAYLOAD_SECRET` - A random secret string
     - `NEXT_PUBLIC_SITE_URL` - Your Vercel deployment URL (e.g., https://your-app.vercel.app)

4. **Connect MongoDB:**
   - Use MongoDB Atlas (recommended) or any MongoDB-compatible database
   - Copy the connection string to `DATABASE_URL`
   - Ensure your database allows connections from Vercel's IP ranges

5. **Deploy:**
   - Vercel will automatically build and deploy
   - Your admin panel will be available at `https://your-app.vercel.app/admin`

## Features

### Core Architecture

- ✅ Server Components by default (minimal client JS)
- ✅ CMS-driven content (Payload CMS + MongoDB)
- ✅ Type-safe with TypeScript
- ✅ Pre-commit hooks for code formatting (Husky + lint-staged)

### Learning Experience

- ✅ **Topic Pages**: Each topic has exactly two sections:
  - **Theory**: Detailed, reference-backed content with rich text rendering
  - **Practice**: Interactive demos with teaching-first animations
- ✅ **Interactive Demos**: Constraint-based architecture decision simulators
- ✅ **Guided Steps**: Step-by-step walkthroughs with focus highlighting
- ✅ **Hands-on Tasks**: Practice exercises with answer validation

### Motion & Accessibility

- ✅ Respects `prefers-reduced-motion` system preference
- ✅ In-UI "Reduce Motion" toggle with localStorage persistence
- ✅ Teaching-first animations (only for learning, not decoration)
- ✅ Static emphasis fallbacks when motion is reduced

### UI/UX

- ✅ Distraction-free UI with subtle animations
- ✅ Responsive 3-column layout (desktop) / single column (mobile)
- ✅ Dark mode support via next-themes
- ✅ PWA support with offline fallback

## Current Content

### Resource 1: Foundations

- **Topic**: Frontend System Design Foundations: Requirements, Constraints, and Architecture Thinking
- **Route**: `/topics/foundations`
- **Demo**: Interactive "Constraints → Decisions → Architecture" simulator
  - Adjust constraints (traffic, latency, SEO, device mix, offline, real-time, accessibility, i18n)
  - See architecture decisions update in real-time
  - View decision log with cause-and-effect explanations

### Curriculum Index

See `docs/curriculum-index.md` for the full 12-resource curriculum plan.

## Development Notes

- The site works with an empty database (shows empty states)
- Rich text content from Payload uses Lexical editor (basic renderer implemented)
- Service worker is disabled in development mode
- All secrets use environment variables (never hardcoded)
- PDF reference files in `docs/_source/` are gitignored (dev-only)
- Curriculum content lives in CMS, not in code files

## Next Steps

- Resource 2: Rendering Strategies & Data Lifecycles (CSR, SSR, SSG, ISR, Streaming, Hydration)
- Additional topics following the curriculum index
