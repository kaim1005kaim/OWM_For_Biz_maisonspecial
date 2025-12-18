# OWM Biz Demo - MAISON SPECIAL Design Studio

AI-powered fashion design generation tool for enterprise demonstration.

## Features

- **Library**: Reference image archive with automatic tagging and categorization
- **Moodboard**: Create reference sets (3-8 images) for design generation
- **Generate**: Batch generate 12/24/48 design variations based on reference sets
- **Refine**: Iterative editing with preset modifications (length, material, color, etc.)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase Postgres
- **Storage**: Cloudflare R2 (S3-compatible)
- **AI**: Gemini API (Google AI Studio)
- **UI**: Tailwind CSS + OWM Design System

## Setup

### 1. Create Services

Create new projects for:
- **Supabase**: Create at https://supabase.com
- **Cloudflare R2**: Create bucket at https://dash.cloudflare.com
- **Vercel**: Deploy from GitHub

### 2. Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `R2_ENDPOINT` - Cloudflare R2 S3 endpoint
- `R2_ACCESS_KEY_ID` - R2 access key ID
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET` - R2 bucket name
- `R2_PUBLIC_URL` - R2 public URL for assets
- `GEMINI_API_KEY` - Google AI Studio API key

### 3. Database Setup

Run the SQL schema in Supabase SQL Editor:

```bash
# Copy contents of supabase/schema.sql to Supabase SQL Editor
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Seed Images

To pre-populate the library with reference images:

```bash
# Create seed directory
mkdir seed_images

# Add your images (jpg, png, webp)
# Then run:
node scripts/import-seed.mjs --workspace maison_demo --collection maison_archive_2019_2025 --dir ./seed_images
```

## Demo Workflow

1. **Before demo**: Import seed images (MAISON SPECIAL archive)
2. **Library**: Show existing archive, allow additional uploads
3. **Moodboard**: Select 5 reference images for "今月の型"
4. **Generate**: Create 24 design variations (2K quality)
5. **Filter**: Star top 3 designs
6. **Refine**: Edit selected designs (丈→素材→配色)
7. **History**: Show decision log for explanation

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/      # Image upload
│   │   ├── annotate/    # Auto-tagging
│   │   ├── generate/    # Batch generation
│   │   ├── edit/        # Image editing
│   │   ├── assets/      # Asset queries
│   │   └── boards/      # Moodboard CRUD
│   ├── library/         # Reference archive
│   ├── board/           # Moodboard management
│   ├── generate/        # Design generation
│   ├── refine/          # Image editing
│   └── history/         # Generation log
├── components/
│   ├── Navigation.tsx
│   ├── ImageGrid.tsx
│   └── UploadModal.tsx
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── r2.ts            # R2 storage client
│   ├── gemini.ts        # Gemini API client
│   └── image.ts         # Image utilities
└── types/
    └── index.ts         # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload reference image |
| `/api/annotate` | POST | Generate tags/caption for image |
| `/api/generate` | POST | Batch generate designs |
| `/api/edit` | POST | Edit existing design |
| `/api/assets` | GET | Query assets with filters |
| `/api/boards` | GET/POST/PUT/DELETE | Moodboard CRUD |

## Security Notes

- API keys are server-side only (never exposed to browser)
- No authentication required for demo (internal use)
- Admin seed functionality should be protected in production

## License

Internal use only. Based on OWM technology.
