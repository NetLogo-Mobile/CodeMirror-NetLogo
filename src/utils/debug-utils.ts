/** Log: Log to console if debug is enabled. */
export const Log = !(window as any).GalapagosSilent ? console.log : () => {};
