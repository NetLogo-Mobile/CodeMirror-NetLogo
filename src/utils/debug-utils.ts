/** Log: Log to console if debug is enabled. */
export const Log = !(globalThis as any).GalapagosSilent ? console.log : () => {};
