/**
 * Barrel for the modular pool-chemistry calculator.
 *
 * Importing from `@/lib/calculator` resolves here. This keeps the original
 * chlorine-comparison imports working after the file was split into a module.
 */

// Shared types & helpers
export * from './types';
export * from './constants';
export * from './range';
export * from './units';

// Calculation primitives
export * from './chlorine-target';
export * from './chlorine-dose';
export * from './product-conversion';
export * from './pool-volume';

// Orchestrator
export * from './shock';

// Existing tool (moved verbatim from the old calculator.ts)
export * from './chlorine-comparison';
