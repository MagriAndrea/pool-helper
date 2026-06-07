/**
 * localStorage key registry.
 *
 * Architecture: "per-tool keys with bidirectional shared references".
 *  - Each tool persists its full state under a `TOOL_KEYS` entry.
 *  - Values that represent pool *reality* (volume, CYA, FC, CC) are mirrored to
 *    `SHARED_KEYS` so other tools reuse them while you work. Writing tool state
 *    updates both; a tool's reset is a FULL wipe — it clears the tool key AND the
 *    shared keys, so every field is cleared and stays cleared on reload.
 *
 * All keys are prefixed `ph_` (pool-helper) to avoid collisions on the origin.
 */

export const SHARED_KEYS = {
  poolVolume: 'ph_pool_volume', // { value: number; unit: 'L' | 'gal' }
  poolCYA: 'ph_pool_cya', // number (ppm)
  poolFC: 'ph_pool_fc', // number (ppm)
  poolCC: 'ph_pool_cc', // number (ppm)
} as const;

export const TOOL_KEYS = {
  shock: 'ph_tool_shock',
  volume: 'ph_tool_volume', // reserved for the future standalone volume tool
} as const;
