# Deferred Items — Phase 05

## Pre-existing Turbopack Build Failure

**Status:** Pre-existing (present before Plan 03 changes)
**Scope:** Out of scope for Plan 03 (widget-only plan)

**Issue:** `npm run build` fails with Turbopack errors:
```
Module not found: Can't resolve '../db/client.js'
Module not found: Can't resolve '../notifications.js'
```

**Location:** `lib/ai/tools.ts` lines 3-4

**Root cause:** Turbopack (Next.js 16 default) cannot resolve `.js` extension imports for TypeScript source files. The imports use CommonJS-style `.js` extensions (`../db/client.js`) which Turbopack handles differently than Webpack.

**Confirmed pre-existing:** Build was failing on commit `b8e3915` (the base of the worktree) before any Plan 03 changes were applied.

**Widget Vite build:** Succeeds correctly — only the Next.js Turbopack build is affected.

**Fix needed:** Either configure `turbopack.root` in `next.config.ts` or change the imports in `lib/ai/tools.ts` to drop the `.js` extension (TypeScript source files should use `.ts` or no extension).
