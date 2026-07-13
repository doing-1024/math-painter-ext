import type { Style } from './types.js';

/** Default shape style. The host app overrides `stroke`/`fill` at draw time to
 *  render committed shapes as white (or green when selected), so the stored
 *  colour only matters for serialization / export. */
export const DEFAULT_STYLE: Style = { stroke: '#ffffff', fill: '#ffffff', width: 1.5 };
