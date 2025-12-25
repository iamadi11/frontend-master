# Learning Content Website

A backend-driven, minimalistic, modern, and scalable learning content website built with Next.js, Payload CMS, and MongoDB.

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
- `npm run seed` - Seed database with sample content (creates 1 sample Resource + 1 sample Page)

## Admin Panel & Content Management

The admin panel is available at `/admin`. Here you can:

1. **Create a user account** (first time setup):
   - Navigate to http://localhost:3000/admin
   - Create your first admin user

2. **Manage content:**
   - **Pages**: Create pages with title, slug, status (draft/published), and rich text content
   - **Resources**: Create resources with title, resource number, summary, body, and references

3. **Content flow:**
   - Content created in Payload CMS → Stored in MongoDB → Rendered by Next.js routes
   - Pages are accessible at `/{slug}` (only published pages)
   - Resources are listed at `/resources` and accessible at `/resources/{number}`

## Project Structure

```
src/
  app/
    (site)/              # Public website routes
      page.tsx           # Homepage
      resources/         # Resources listing and detail pages
      [...slug]/         # Dynamic page routes by slug
    layout.tsx           # Root layout with theme provider
    manifest.ts          # PWA manifest
    sw.ts                # Service worker
    offline/             # Offline fallback page
  lib/
    payload.ts           # Payload client initialization (server-only)
    content.ts           # Content access functions (server-only)
    utils.ts             # Utility functions
  components/
    theme-provider.tsx   # Theme context provider
    motion-wrapper.tsx   # Route transition wrapper
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

- ✅ Server Components by default (minimal client JS)
- ✅ Distraction-free UI with subtle animations
- ✅ Respects `prefers-reduced-motion` for accessibility
- ✅ PWA support with offline fallback
- ✅ Responsive 3-column layout (desktop) / single column (mobile)
- ✅ Dark mode support via next-themes
- ✅ Type-safe with TypeScript
- ✅ Pre-commit hooks for code formatting (Husky + lint-staged)

## Notes

- The site works with an empty database (shows empty states)
- Rich text content from Payload uses Lexical editor (rendering placeholder for now)
- Service worker is disabled in development mode
- All secrets use environment variables (never hardcoded)
