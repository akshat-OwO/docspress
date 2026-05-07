import { fileURLToPath } from "node:url";

/** Resolves next to `dist/entry-client.js` (same as this module's output position after bundling). */
export const ENTRY_CLIENT_FILE = fileURLToPath(new URL("./entry-client.js", import.meta.url));
