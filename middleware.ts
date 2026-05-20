/**
 * middleware.ts — Next.js entry point for request interception.
 *
 * This file is required by Next.js (must be named `middleware.ts` at the
 * project root). It re-exports the `proxy` function as `middleware` so
 * Next.js picks it up, while keeping all implementation in `proxy.ts`.
 *
 * Do NOT add logic here — edit proxy.ts instead.
 */

export { proxy as middleware, config } from './proxy';
