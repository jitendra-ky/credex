# Credex - Next.js App

Next.js 14 + TypeScript (strict) + ESLint + Prettier + Jest

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
src/
├── app/           # Next.js App Router
├── core/          # Core logic, providers
├── features/      # Feature modules
├── components/    # Shared components
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Utilities
├── types/         # Type definitions
├── constants/     # Constants
└── context/       # Context providers
```

## Scripts

```bash
npm run dev              # Dev server
npm run build            # Build
npm start                # Production
npm run lint             # Lint
npm run lint:fix         # Fix lint
npm run format           # Format
npm run type-check       # Type check
npm test                 # Tests
```

## Import Aliases

```typescript
@/              → src/
@/features/     → src/features/
@/components/   → src/components/
@/hooks/        → src/hooks/
@/services/     → src/services/
@/utils/        → src/utils/
@/types/        → src/types/
@/constants/    → src/constants/
@/context/      → src/context/
```

## Setup Info

- **Framework**: Next.js 14+
- **Language**: TypeScript (Strict Mode)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library
- **Editor**: VS Code configured

## Verify Setup

```bash
npm run type-check  # TypeScript
npm run lint        # ESLint
npm test            # Tests
```

All working? You're ready to build! 🚀