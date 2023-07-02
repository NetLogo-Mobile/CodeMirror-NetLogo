/** Log: Log to console if debug is enabled. */
export const Log = !((globalThis ?? window) as any).GalapagosSilent ? console.log : () => {};
