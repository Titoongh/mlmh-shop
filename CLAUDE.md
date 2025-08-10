# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MLMH Shop is a Next.js e-commerce application for selling guitar tablatures and lessons. It's built with:
- **Next.js 14** (App Router) with TypeScript
- **Prisma ORM** with PostgreSQL database
- **Tailwind CSS** for styling
- **Stripe** for payment processing
- **Scaleway S3** for file storage
- **Docker** for deployment

## Key Commands

### Development
```bash
npm run dev                    # Start development server
```

### Database Management
```bash
npx prisma generate            # Generate Prisma client after schema changes
npx prisma migrate dev --create-only --name "migration-name"  # Only create migration
npx prisma migrate dev --name "migration-name"  # Create and apply dev migration
npx prisma migrate deploy      # Apply migrations in production: Only the ci/cd does migrations in production
```

### Testing & External Services
```bash
npm run test-scaleway         # Test Scaleway S3 connection
stripe listen --forward-to localhost:3000/api/webhook/stripe  # Local Stripe webhooks
```

### Build & Deploy
```bash
npm run build                 # Production build
npm run start                # Start production server
npm run lint                 # Run ESLint
```

## Database Architecture

### Core Models
- **Artist**: Musicians/composers with tablatures and content
- **Tablature**: Sheet music/tabs with pricing and files
- **TablatureFile**: Multiple file attachments per tablature (stored in Scaleway)
- **Content**: Media content (audio/video/images) for artists/tablatures
- **MusicalGenre**: Categories for organizing content

### E-commerce Models
- **DownloadIntent**: Tracks Stripe checkout sessions
- **Download**: Individual tablature downloads per intent

### Key Relationships
- Artists ↔ Tablatures (many-to-many)
- Tablatures ↔ TablatureFiles (one-to-many)
- Tablatures ↔ MusicalGenres (many-to-many)
- Artists/Tablatures ↔ Content (one-to-many)

## API Structure

### Public APIs
- `/api/tablatures` - List all visible tablatures
- `/api/artists` - List all visible artists
- `/api/checkout` - Stripe payment processing
- `/api/download` - Handle file downloads after purchase
- `/api/recommendations/*` - Get trending/popular/latest content

### Admin APIs
- `/api/admin/tablatures` - CRUD operations for tablatures
- `/api/admin/artists` - CRUD operations for artists
- `/api/admin/upload` - File upload functionality

### Webhooks
- `/api/webhook/stripe` - Handle Stripe payment events

## File Storage Architecture

The app uses a hybrid storage system:
- **Scaleway S3**: Primary storage for tablature files (PDFs, audio)
- **Local uploads**: Temporary storage in `public/uploads/` during development
- **Signed URLs**: Generated for secure file access

## Key Directories

- `app/` - Next.js app directory structure
  - `api/` - API route handlers
  - `components/` - Reusable React components
  - `hooks/` - Custom React hooks
  - `types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations
- `services/` - External service integrations (Scaleway)
- `scripts/` - Database migration and maintenance scripts
- `temp_tablatures*/` - Temporary file storage directories

## Environment Configuration

The application requires these environment variables:
- Database: `DATABASE_URL`
- Scaleway: `SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `SCW_BUCKET_NAME`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Next.js: `NODE_ENV`

## Development Patterns

### Error Logging
Use `console.error('Context:', error)` consistently throughout the codebase.

### File Uploads
- Files are uploaded to Scaleway S3 with unique keys
- Use `TablatureFile` model to track file metadata
- Generate signed URLs for secure downloads

### Hidden Content
Both artists and tablatures support a `hidden` field for controlling visibility without deletion.

### Type Safety
- Use Prisma-generated types from `@prisma/client`
- Custom interfaces in `app/types/types.ts` extend base models
- Leverage TypeScript strict mode features

## Important Notes

- **Working Directory**: All commands should be run from `mlmh-shop-app/`
- **Migration Strategy**: Always run `prisma generate` after schema changes
- **File Storage**: New files use Scaleway; legacy files may use local storage
- **Payment Flow**: Stripe checkout → webhook → file access granted
- **Development Database**: Use Docker Compose for local PostgreSQL instance


## Custom instructions from the human developer
### Database
- Do not try to generate the prisma client yourself, let me do it every time.
- Do not try to modify the database schema without consulting me first, and let me do it by myself.